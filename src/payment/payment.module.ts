// payment/payment.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { UserModule } from '../user/user.module';
import { StripeProvider } from './stripe.provider';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { StripeWebhookController } from './stripe.webhook.controller';

@Module({
    imports: [
      MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema  }  ,   { name: Subscription.name, schema: SubscriptionSchema },]),
      UserModule
    ],
    providers: [PaymentService, StripeProvider],
    controllers: [PaymentController , StripeWebhookController],
    exports: [PaymentService]
  })
  export class PaymentModule {}