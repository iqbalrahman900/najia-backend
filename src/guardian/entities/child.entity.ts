import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Types } from 'mongoose';

export type ChildDocument = Child & Document;

@Schema({
  timestamps: true,
  collection: 'children',
  toJSON: {
    virtuals: true,
    transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class Child {
  @Prop({ required: true, unique: true })
  uniqueId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  parentId: Types.ObjectId;

  @Prop({ default: 1 })
  currentLevel: number;

  @Prop({ default: 0 })
  stars: number;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Task' }],
    default: []
  })
  assignedTasks: Types.ObjectId[];

  @Prop({ required: true })
  loginCode: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const ChildSchema = SchemaFactory.createForClass(Child);

// ✅ Keep indexes only in `Schema.index(...)`
ChildSchema.index({ uniqueId: 1 }, { unique: true });
ChildSchema.index({ loginCode: 1 });
ChildSchema.index({ parentId: 1 });
ChildSchema.index({ assignedTasks: 1 });
ChildSchema.index({ isActive: 1 });
ChildSchema.index({ parentId: 1, isActive: 1 });
ChildSchema.index({ loginCode: 1, isActive: 1 });

// 🔹 Validation Middleware
ChildSchema.pre('save', function (next) {
  if (!this.uniqueId.startsWith('CHILD-')) {
    this.uniqueId = `CHILD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  }

  if (this.isModified('loginCode')) {
    if (!/^\d{6}$/.test(this.loginCode)) {
      return next(new Error('Login code must be exactly 6 digits'));
    }
  }

  if (this.age < 1 || this.age > 17) {
    return next(new Error('Age must be between 1 and 17'));
  }

  next();
});

// 🔹 Virtual Property
ChildSchema.virtual('activeTasksCount').get(function () {
  return this.assignedTasks.length || 0;
});

// 🔹 Methods for Task Management
ChildSchema.methods.addTask = function (taskId: Types.ObjectId) {
  if (!this.assignedTasks.includes(taskId)) {
    this.assignedTasks.push(taskId);
  }
  return this.save();
};

ChildSchema.methods.removeTask = function (taskId: Types.ObjectId) {
  this.assignedTasks = this.assignedTasks.filter(id => !id.equals(taskId));
  return this.save();
};

ChildSchema.methods.hasTask = function (taskId: Types.ObjectId) {
  return this.assignedTasks.some(id => id.equals(taskId));
};

// 🔹 Static Methods
ChildSchema.statics.findByLoginCode = function (loginCode: string) {
  return this.findOne({ loginCode, isActive: true }).populate('assignedTasks');
};

ChildSchema.statics.findActiveChildren = function (parentId: Types.ObjectId) {
  return this.find({ parentId, isActive: true }).sort({ createdAt: -1 });
};

// Ensure assignedTasks is always an array
ChildSchema.pre('save', function (next) {
  if (!Array.isArray(this.assignedTasks)) {
    this.assignedTasks = [];
  }
  next();
});

// Clear assignedTasks when deactivating a child
ChildSchema.pre('save', async function (next) {
  if (this.isModified('isActive') && !this.isActive) {
    this.assignedTasks = [];
  }
  next();
});

export interface IChild extends Document {
  uniqueId: string;
  name: string;
  age: number;
  parentId: Types.ObjectId;
  currentLevel: number;
  stars: number;
  assignedTasks: Types.ObjectId[];
  loginCode: string;
  isActive: boolean;
  activeTasksCount: number;
  addTask: (taskId: Types.ObjectId) => Promise<IChild>;
  removeTask: (taskId: Types.ObjectId) => Promise<IChild>;
  hasTask: (taskId: Types.ObjectId) => boolean;
}

export interface IChildModel extends Model<IChild> {
  findByLoginCode: (loginCode: string) => Promise<IChild>;
  findActiveChildren: (parentId: Types.ObjectId) => Promise<IChild[]>;
}
