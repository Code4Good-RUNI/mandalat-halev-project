import {
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';
import { NotificationsService } from './notifications.service';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Controller()
export class NotificationsDevController {
  private readonly logger = new Logger(NotificationsDevController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationSchedulerService: NotificationSchedulerService,
  ) {}

  // Env values are always strings, so compare against 'true' explicitly —
  // a get<boolean>() cast would treat the string 'false' as truthy.
  private get devEndpointsEnabled(): boolean {
    return (
      this.configService.get<string>(
        'ENABLE_NOTIFICATION_CRON_MANUAL_TRIGGER',
        'false',
      ) === 'true'
    );
  }

  private assertDevEndpointsEnabled() {
    if (!this.devEndpointsEnabled) {
      this.logger.warn(
        'Dev notification endpoint attempted but it is disabled in this environment.',
      );
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }
  }

  @TsRestHandler(userContract.notifications.test)
  async sendTestNotification() {
    return tsRestHandler(userContract.notifications.test, async ({ body }) => {
      this.assertDevEndpointsEnabled();

      await this.notificationsService.sendToUser(body.salesforceUserId, {
        title: body.title,
        body: body.body,
        data: body.data,
      });

      return { status: 200, body: { ok: true } };
    });
  }

  @TsRestHandler(userContract.notifications.cronRun)
  async manualCronRun(@Headers('x-cron-secret') cronSecretHeader?: string) {
    return tsRestHandler(userContract.notifications.cronRun, async () => {
      // Production trigger: Cloud Scheduler calls this endpoint with the
      // X-Cron-Secret header. Otherwise fall back to the dev-only flag.
      const cronSecret = this.configService.get<string>('CRON_SECRET');
      const isSchedulerCall =
        !!cronSecret && !!cronSecretHeader && cronSecretHeader === cronSecret;

      if (!isSchedulerCall) {
        this.assertDevEndpointsEnabled();
      }

      this.logger.log(
        'Manual trigger received via POST /notifications/cron-run. Executing orchestration...',
      );
      await this.notificationSchedulerService.handleDailyNotifications();

      return {
        status: 200,
        body: {
          ok: true,
          message:
            'Cron orchestration executed. Check server logs for details.',
        },
      };
    });
  }
}
