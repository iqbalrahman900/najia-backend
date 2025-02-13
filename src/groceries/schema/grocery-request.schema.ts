import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GroceryRequestDocument = GroceryRequest & Document;

@Schema({ timestamps: true })
export class GroceryRequest {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, min: 1, max: 300 })
  amountRequested: number;

  @Prop()
  reason?: string;

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;
}

export const GroceryRequestSchema = SchemaFactory.createForClass(GroceryRequest);
