// qada-puasa/schemas/qada-puasa.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type QadaPuasaDocument = QadaPuasa & Document;

@Schema({ timestamps: true })
export class QadaPuasa {
  _id: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  totalYears: number;

  @Prop({ required: true })
  totalDays: number;
 
  @Prop({ required: true, default: 0 })
  completedDays: number;

  @Prop([{
    date: { type: Date, required: true },
    notes: { type: String }
  }])
  history: { date: Date; notes?: string }[];
}

export const QadaPuasaSchema = SchemaFactory.createForClass(QadaPuasa);