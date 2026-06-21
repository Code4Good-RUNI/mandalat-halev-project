import {
  Controller,
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

  @TsRestHandler(userContract.notifications.test)
  async sendTestNotification() {
    return tsRestHandler(userContract.notifications.test, async ({ body }) => {
      await this.notificationsService.sendToUser(body.salesforceUserId, {
        title: body.title,
        body: body.body,
        data: body.data,
      });

      return { status: 200, body: { ok: true } };
    });
  }

  @TsRestHandler(userContract.notifications.cronRun)
  async manualCronRun() {
    return tsRestHandler(userContract.notifications.cronRun, async () => {
      const isManualTriggerEnabled = this.configService.get<boolean>(
        'ENABLE_NOTIFICATION_CRON_MANUAL_TRIGGER',
        false,
      );

      if (!isManualTriggerEnabled) {
        this.logger.warn(
          'Manual cron trigger attempted but it is disabled in this environment.',
        );
        throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
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
