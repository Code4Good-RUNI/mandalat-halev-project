import { Controller, UseGuards } from '@nestjs/common';
import { tsRestHandler, TsRestHandler } from '@ts-rest/nest';
import { userContract } from '@mandalat-halev-project/api-interfaces';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { NotificationsService } from './notifications.service';

@Controller()
@UseGuards(FirebaseAuthGuard) 
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @TsRestHandler(userContract.notifications.register)
  async registerDevice(@CurrentUser('sub') salesforceUserId: string) {
    return tsRestHandler(userContract.notifications.register, async ({ body }) => {
      
      await this.notificationsService.register(
        salesforceUserId,
        body.deviceOs,
        body.nativeToken,
        body.expoToken
      );

      return { status: 200, body: { ok: true } };
    });
  }

  @TsRestHandler(userContract.notifications.unregister)
  async unregisterDevice(@CurrentUser('sub') salesforceUserId: string) {
    return tsRestHandler(userContract.notifications.unregister, async ({ body }) => {
      await this.notificationsService.unregister(salesforceUserId, body.nativeToken);
      return { status: 200, body: { ok: true } };
    });
  }

  @TsRestHandler(userContract.notifications.preferences)
  async updatePreferences(@CurrentUser('sub') salesforceUserId: string) {
    return tsRestHandler(userContract.notifications.preferences, async ({ body }) => {
      await this.notificationsService.updatePreferences(
        salesforceUserId, 
        body.nativeToken, 
        body.preferences
      );
      return { status: 200, body: { ok: true } };
    });
  }

  @TsRestHandler(userContract.notifications.test)
  async sendTestNotification(@CurrentUser('sub') salesforceUserId: string) {
    return tsRestHandler(userContract.notifications.test, async ({ body }) => {
      await this.notificationsService.sendToUser(salesforceUserId, {
        title: body.title,
        body: body.body,
        data: body.data,
      });

      return { status: 200, body: { ok: true } };
    });
  }
}
