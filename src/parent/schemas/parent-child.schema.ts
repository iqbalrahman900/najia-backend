// parent/schemas/parent-child.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

@Schema()
export class ParentChild extends Document {
    @Prop({ required: true })
    parentUid: string;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Child', required: true })
    childId: mongoose.Types.ObjectId;
}

export const ParentChildSchema = SchemaFactory.createForClass(ParentChild);