import { Global, Module } from '@nestjs/common';
import { WhatsAppGatewayAdapter } from './channels/whatsapp-gateway.adapter';
import { WhatsAppCredentialsService } from './integrations/whatsapp-credentials.service';
import { NotificationCenterService } from './notification-center.service';

/** @Global(): mismo criterio que el resto de core/* — ver core/config/config.module.ts. */
@Global()
@Module({
  providers: [WhatsAppCredentialsService, WhatsAppGatewayAdapter, NotificationCenterService],
  exports: [NotificationCenterService, WhatsAppCredentialsService],
})
export class NotificationsModule {}
