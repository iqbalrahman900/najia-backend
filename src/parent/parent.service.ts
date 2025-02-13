// src/parent/parent.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { Parent } from './schemas/parent.schema';
import { Child } from '../child/schemas/child.schema';
import { Task } from '../task/schemas/task.schema';
import { ParentChild } from './schemas/parent-child.schema';
import { CreateChildDto } from './dto/create-child.dto';
import { AssignTaskDto } from '../task/dto/assign-task.dto';

@Injectable()
export class ParentService {
  constructor(
    @InjectModel(Parent.name) private parentModel: Model<Parent>,
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(ParentChild.name) private parentChildModel: Model<ParentChild>
  ) {}

  // src/parent/parent.service.ts
async createChild(createChildDto: CreateChildDto) {
  const session = await this.parentModel.db.startSession();
  session.startTransaction();

  try {
    // Create child
    const [newChild] = await this.childModel.create([{
      name: createChildDto.name,
      age: createChildDto.age,
      uniqueId: this.generateUniqueId(),
      assignedTasks: []
    }], { session });

    // Create parent-child relationship
    await this.parentChildModel.create([{
      parentId: createChildDto.parentId, // This will be MongoDB _id
      childId: newChild._id
    }], { session });

    await session.commitTransaction();
    
    return this.childModel
      .findById(newChild._id)
      .populate('assignedTasks');

  } catch (error) {
    await session.abortTransaction();
    console.error('Error in createChild:', error);
    throw error;
  } finally {
    session.endSession();
  }
}

async getParentDashboard(parentId: string) {
  try {
    // Find parent by _id with populated children and their tasks
    const parent = await this.parentModel
      .findById(parentId)
      .populate({
        path: 'children',
        populate: {
          path: 'assignedTasks',
          model: 'Task'
        }
      });

    if (!parent) {
      throw new NotFoundException('Parent not found');
    }

    return parent;
  } catch (error) {
    console.error('Error in getParentDashboard:', error);
    throw error;
  }
}

  async assignTask(assignTaskDto: AssignTaskDto) {
    const session = await this.taskModel.db.startSession();
    session.startTransaction();

    try {
      // Verify the parent-child relationship exists
      const parentChild = await this.parentChildModel
        .findOne({ childId: assignTaskDto.childId });

      if (!parentChild) {
        throw new NotFoundException('Child not found or not associated with parent');
      }

      // Create task
      const [task] = await this.taskModel.create([{
        ...assignTaskDto,
        isCompleted: false,
        isValidated: false
      }], { session });

      // Add task to child's assigned tasks
      await this.childModel.findByIdAndUpdate(
        assignTaskDto.childId,
        { $push: { assignedTasks: task._id } },
        { session }
      );

      await session.commitTransaction();
      return task;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error in assignTask:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async validateTask(taskId: string) {
    const session = await this.taskModel.db.startSession();
    session.startTransaction();

    try {
      const task = await this.taskModel.findByIdAndUpdate(
        taskId,
        { isValidated: true },
        { new: true, session }
      );

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      if (task.isCompleted) {
        await this.childModel.findByIdAndUpdate(
          task.childId,
          { $inc: { stars: 5 } },
          { session }
        );
      }

      await session.commitTransaction();
      return task;
    } catch (error) {
      await session.abortTransaction();
      console.error('Error in validateTask:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  private generateUniqueId(): string {
    return `CH${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
}