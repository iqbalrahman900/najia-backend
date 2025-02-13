import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Child } from './schemas/child.schema';
import { Task } from '../task/schemas/task.schema';
import { CompleteTaskDto } from './dto/complete-task.dto';

@Injectable()
export class ChildService {
  constructor(
    @InjectModel(Child.name) private childModel: Model<Child>,
    @InjectModel(Task.name) private taskModel: Model<Task>
  ) {}

  async login(loginCode: string) {
    const child = await this.childModel
      .findOne({ loginCode, isActive: true })
      .exec();
   
    if (!child) {
      throw new NotFoundException('Invalid login code');
    }

    // Fetch tasks separately for better control
    const tasks = await this.taskModel.find({
      _id: { $in: child.assignedTasks },
      isActive: true
    }).exec();
   
    return {
      uniqueId: child.uniqueId,
      name: child.name,
      age: child.age,
      currentLevel: child.currentLevel,
      stars: child.stars,
      assignedTasks: tasks
    };
  }

  async getChildDashboard(uniqueId: string) {
    const child = await this.childModel
      .findOne({ uniqueId, isActive: true })
      .exec();
      
    if (!child) {
      throw new NotFoundException(`Child with ID ${uniqueId} not found`);
    }

    // Fetch tasks separately
    const tasks = await this.taskModel.find({
      _id: { $in: child.assignedTasks },
      isActive: true
    }).sort({ assignedDate: -1 }).exec();

    const pendingTasks = tasks.filter(task => !task.isCompleted);
    const completedTasks = tasks.filter(task => task.isCompleted);
    const validatedTasks = tasks.filter(task => task.isValidated);

    return {
      childInfo: {
        name: child.name,
        age: child.age,
        currentLevel: child.currentLevel,
        stars: child.stars
      },
      taskStats: {
        total: tasks.length,
        pending: pendingTasks.length,
        completed: completedTasks.length,
        validated: validatedTasks.length,
        progress: tasks.length > 0 
          ? (validatedTasks.length / tasks.length) * 100 
          : 0
      },
      tasks: tasks
    };
  }

  async completeTask(completeTaskDto: CompleteTaskDto) {
    // Verify child exists and is active
    const child = await this.childModel.findOne({
      uniqueId: completeTaskDto.childId,
      isActive: true
    });

    if (!child) {
      throw new NotFoundException('Child not found or inactive');
    }

    // Find and update task
    const task = await this.taskModel.findOneAndUpdate(
      {
        _id: completeTaskDto.taskId,
        isActive: true,
        isCompleted: false // Prevent completing already completed tasks
      },
      { 
        isCompleted: true,
        completedDate: new Date()
      },
      { new: true }
    );

    if (!task) {
      throw new NotFoundException('Task not found or already completed');
    }

    // Update child progress if task is validated
    if (task.isValidated) {
      await this.updateChildProgress(completeTaskDto.childId);
    }

    return task;
  }

  private async updateChildProgress(childId: string) {
    const child = await this.childModel.findOne({ 
      uniqueId: childId,
      isActive: true 
    });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const completedTasks = await this.taskModel.countDocuments({
      childId: child._id,
      isValidated: true,
      isActive: true,
      level: child.currentLevel
    });

    // Level up condition: 5 validated tasks at current level
    if (completedTasks >= 5) {
      await this.childModel.findByIdAndUpdate(child._id, {
        $inc: { 
          currentLevel: 1,
          stars: 10 // Bonus stars for leveling up
        }
      });
    }
  }

  async getProgress(uniqueId: string) {
    const child = await this.childModel
      .findOne({ uniqueId, isActive: true })
      .populate({
        path: 'assignedTasks',
        match: { isActive: true }
      });

    if (!child) {
      throw new NotFoundException('Child not found');
    }

    const totalTasks = child.assignedTasks?.length || 0;
    const completedTasks = child.assignedTasks?.filter(task => task.isCompleted).length || 0;
    const validatedTasks = child.assignedTasks?.filter(task => task.isValidated).length || 0;

    // Calculate level progress
    const tasksForCurrentLevel = child.assignedTasks?.filter(
      task => task.level === child.currentLevel && task.isValidated
    ).length || 0;

    return {
      currentLevel: child.currentLevel,
      stars: child.stars,
      totalTasks,
      completedTasks,
      validatedTasks,
      progress: totalTasks > 0 ? (validatedTasks / totalTasks) * 100 : 0,
      levelProgress: {
        tasksCompleted: tasksForCurrentLevel,
        tasksRequired: 5,
        percentage: (tasksForCurrentLevel / 5) * 100
      }
    };
  }
}