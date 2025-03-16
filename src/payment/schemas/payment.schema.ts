import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Payment extends Document {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  planType: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: Date.now })
  date: Date;

  @Prop({ required: true })
  status: string;

  @Prop()
  stripePaymentIntentId: string;

  @Prop()
  voucherCode?: string;

  @Prop()
  discountAmount?: number;

  @Prop()
  originalAmount?: number;

  @Prop({ type: Object })
  voucherDetails?: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
  };
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);