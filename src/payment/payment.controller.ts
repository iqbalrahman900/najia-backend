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

  @Post('validate-voucher')
  async validateVoucher(
    @Body() body: { code: string, amount?: number }
  ) {
    const validation = await this.paymentService.validateVoucherCode(body.code);
    
    if (!validation.valid) {
      return validation;
    }

    // If amount is provided, calculate the discounted price
    if (body.amount) {
      const calculation = await this.paymentService.calculateDiscountedAmount(
        body.amount,
        body.code
      );
      
      return {
        ...validation,
        originalAmount: body.amount,
        finalAmount: calculation.finalAmount,
        discountAmount: calculation.discountAmount,
      };
    }

    return validation;
  }


  @Post('create-voucher')
async createVoucher(@Body() body: {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  expiresAt?: string;  // ISO date string
  maxRedemptions?: number;
}) {
  const data = {
    ...body,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
  };
  return this.paymentService.createVoucher(data);
}
}