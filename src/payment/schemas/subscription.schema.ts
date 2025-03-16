// payment/schemas/subscription.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Subscription extends Document {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  planType: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true, default: 'active' })
  status: string;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);