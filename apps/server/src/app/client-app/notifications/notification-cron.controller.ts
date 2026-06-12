import { Controller, Post, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationSchedulerService } from './notification-scheduler.service';

@Controller('notifications')
export class NotificationCronController {
  private readonly logger = new Logger(NotificationCronController.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationSchedulerService: NotificationSchedulerService,
  ) {}

  @Post('cron-run')
  async manualTrigger() {
    const isManualTriggerEnabled = this.configService.get<boolean>(
      'ENABLE_NOTIFICATION_CRON_MANUAL_TRIGGER',
      false,
    );

    if (!isManualTriggerEnabled) {
      this.logger.warn('Manual cron trigger attempted but it is disabled in this environment.');
      throw new HttpException('Not Found', HttpStatus.NOT_FOUND);
    }

    this.logger.log('Manual trigger received via POST /notifications/cron-run. Executing orchestration...');
    await this.notificationSchedulerService.handleDailyNotifications();

    return { ok: true, message: 'Cron orchestration executed. Check server logs for details.' };
  }
}