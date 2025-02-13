// src/task/schemas/task.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema({ 
  timestamps: true,
  collection: 'tasks'
})
export class Task {
  @Prop({ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true  
  })
  parentId: Types.ObjectId;

  @Prop({ 
    type: Types.ObjectId, 
    ref: 'Child', 
    required: true,
    index: true
  })
  childId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: 1 })
  level: number;

  @Prop({ default: 0 })
  points: number;

  @Prop({ default: false })
  isCompleted: boolean;

  @Prop({ default: false })
  isValidated: boolean;

  @Prop({ type: Date, default: Date.now })
  assignedDate: Date;

  @Prop({ type: [String], default: [] })
  badges: string[];

  @Prop({ default: true })
  isActive: boolean;
}

export const TaskSchema = SchemaFactory.createForClass(Task);