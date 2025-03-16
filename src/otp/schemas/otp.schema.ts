// src/otp/schemas/otp.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema({ timestamps: true })
export class Otp {
  @Prop({ sparse: true })
  phoneNumber: string;

  @Prop({ sparse: true })
  email: string;

  @Prop({ required: true })
  code: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ default: false })
  verified: boolean;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);

// Add indexes for quick lookups
OtpSchema.index({ phoneNumber: 1 });
OtpSchema.index({ email: 1 });
OtpSchema.index({ expiresAt: 1 });