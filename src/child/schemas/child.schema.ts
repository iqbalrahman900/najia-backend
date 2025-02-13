// child/schemas/child.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { Task } from 'src/task/schemas/task.schema';

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})
export class Child extends Document {
  @Prop({ required: true })
  uniqueId: string;

  @Prop({ required: true})
  loginCode: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true })
  parentId: mongoose.Types.ObjectId;

  @Prop({ default: 1 })
  currentLevel: number;

  @Prop({ default: 0 })
  stars: number;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }], default: [] })
  assignedTasks: Task[];

  @Prop({ default: true })
  isActive: boolean;
}

export const ChildSchema = SchemaFactory.createForClass(Child);

// Add indexes for better performance
ChildSchema.index({ loginCode: 1 });
ChildSchema.index({ uniqueId: 1 });
ChildSchema.index({ parentId: 1 });
ChildSchema.index({ isActive: 1 });