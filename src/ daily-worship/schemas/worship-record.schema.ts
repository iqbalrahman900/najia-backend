// schemas/worship-record.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WorshipRecordDocument = WorshipRecord & Document;

@Schema({ timestamps: true })
export class WorshipRecord {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true, enum: ['SELAWAT', 'ISTIGFAR', 'QURAN'] })
  type: 'SELAWAT' | 'ISTIGFAR' | 'QURAN';

  @Prop({ required: true })
  count: number;

  @Prop()
  minutes?: number;

  @Prop()
  notes?: string;

  @Prop({ required: true })
  recordDate: Date;
}

export const WorshipRecordSchema = SchemaFactory.createForClass(WorshipRecord);
WorshipRecordSchema.index({ userId: 1, type: 1, recordDate: 1 });