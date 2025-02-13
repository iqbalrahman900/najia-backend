// qada/schemas/qada.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';

@Schema({ timestamps: true })
export class QadaTracker extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: User;

 @Prop({ required: true })
 totalYears: number;

 @Prop({ required: true, default: 0 })
 completedSubuh: number;

 @Prop({ required: true, default: 0 })
 completedZohor: number;

 @Prop({ required: true, default: 0 })
 completedAsar: number;

 @Prop({ required: true, default: 0 })
 completedMaghrib: number;

 @Prop({ required: true, default: 0 })
 completedIsya: number;

 @Prop()
 totalSalah: number;

 @Prop()
 remainingPerPrayer: number;
}

export const QadaTrackerSchema = SchemaFactory.createForClass(QadaTracker);
