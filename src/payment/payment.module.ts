// payment/payment.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { UserModule } from '../user/user.module';
import { StripeProvider } from './stripe.provider';

@Module({
    imports: [
      MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
      UserModule
    ],
    providers: [PaymentService, StripeProvider],
    controllers: [PaymentController],
    exports: [PaymentService]
  })
  export class PaymentModule {}