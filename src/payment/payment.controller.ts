// payment/payment.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

interface CreateIntentDto {
  amount: number;
  currency: string;
  uid: string;
  planType: string;
}

interface ConfirmPaymentDto {
  paymentIntentId: string;
  uid: string;
}

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('create-intent')
  createIntent(@Body() body: CreatePaymentDto) {
    console.log('Received payment intent request:', body);
    return this.paymentService.createPaymentIntent(body);
  }

  @Post('confirm')
  confirmPayment(@Body() body: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(body);
  }

  @Post('validate-promo')
  validatePromo(@Body() body: { code: string }) {
    return this.paymentService.validatePromoCode(body.code);
  }
}