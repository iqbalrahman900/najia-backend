// parent/schemas/parent.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Child } from 'src/child/schemas/child.schema';

@Schema()
export class Parent extends Document {
    @Prop({ required: true })
    uid: string;  // Firebase UID
  
    @Prop({ required: true })
    name: string;
  
    @Prop({ required: true })
    email: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Child' }] })
    children: Child[];
}

export const ParentSchema = SchemaFactory.createForClass(Parent);