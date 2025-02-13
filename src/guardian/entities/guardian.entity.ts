// src/guardian/entities/guardian.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GuardianDocument = Guardian & Document;

@Schema({ timestamps: true })
export class Guardian {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  guardianUserId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  childUserId: Types.ObjectId;

  @Prop({ required: true, enum: ['guardian', 'child'] })
  role: string;

  @Prop({ default: 'pending', enum: ['pending', 'active', 'rejected'] })
  status: string;
}

export const GuardianSchema = SchemaFactory.createForClass(Guardian);

