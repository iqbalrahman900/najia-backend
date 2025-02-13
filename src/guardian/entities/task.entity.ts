// src/guardian/entities/task.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TaskDocument = Task & Document;

export enum TaskDuration {
  DAILY = 'daily',
  THREE_DAYS = 'three_days',
  WEEKLY = 'weekly'
}

@Schema({
  timestamps: true,
  collection: 'tasks'
})
export class Task {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  parentId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Child', required: true })
  childId: MongooseSchema.Types.ObjectId;

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

  @Prop({
    type: String,
    enum: TaskDuration,
    default: TaskDuration.DAILY
  })
  duration: TaskDuration;

  @Prop({ type: Date })
  dueDate: Date;

  // Flattened reward fields
  @Prop({ type: String })
  rewardType: string;

  @Prop({ type: String })
  rewardDescription: string;

  @Prop({ type: Number, default: 0 })
  rewardPoints: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  badges: string[];
}

export const TaskSchema = SchemaFactory.createForClass(Task);

// Pre-save hook to automatically set the due date
TaskSchema.pre('save', function(next) {
  console.log('Pre-save hook running with data:', {
    duration: this.duration,
    reward: {
      type: this.rewardType,
      description: this.rewardDescription,
      points: this.rewardPoints
    }
  });

  if (!this.assignedDate) {
    this.assignedDate = new Date();
  }

  const assignedDate = new Date(this.assignedDate);
  
  switch (this.duration) {
    case TaskDuration.DAILY:
      this.dueDate = new Date(assignedDate.setDate(assignedDate.getDate() + 1));
      break;
    case TaskDuration.THREE_DAYS:
      this.dueDate = new Date(assignedDate.setDate(assignedDate.getDate() + 3));
      break;
    case TaskDuration.WEEKLY:
      this.dueDate = new Date(assignedDate.setDate(assignedDate.getDate() + 7));
      break;
    default:
      this.dueDate = new Date(assignedDate.setDate(assignedDate.getDate() + 1));
  }

  next();
});

// Transform response object to include "reward" field and remove unnecessary fields
TaskSchema.set('toJSON', { 
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.rewardType || ret.rewardDescription || ret.rewardPoints) {
      ret.reward = {
        type: ret.rewardType,
        description: ret.rewardDescription,
        points: ret.rewardPoints
      };
    }
    delete ret.rewardType;
    delete ret.rewardDescription;
    delete ret.rewardPoints;
    delete ret.__v;
    return ret;
  }
});

TaskSchema.set('toObject', { 
  virtuals: true,
  transform: (doc, ret) => {
    if (ret.rewardType || ret.rewardDescription || ret.rewardPoints) {
      ret.reward = {
        type: ret.rewardType,
        description: ret.rewardDescription,
        points: ret.rewardPoints
      };
    }
    delete ret.rewardType;
    delete ret.rewardDescription;
    delete ret.rewardPoints;
    delete ret.__v;
    return ret;
  }
});

// Define indexes (removed duplicates)
TaskSchema.index({ parentId: 1 });
TaskSchema.index({ childId: 1 });
TaskSchema.index({ dueDate: 1 });

