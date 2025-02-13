// task/task.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './schemas/task.schema';
import { Child } from '../child/schemas/child.schema';
import { AssignTaskDto } from './dto/assign-task.dto';
import { CreateTaskDto } from './dto/create-task.dto';

@Injectable()
export class TaskService {
 constructor(
   @InjectModel(Task.name) private taskModel: Model<Task>,
   @InjectModel(Child.name) private childModel: Model<Child>
 ) {}

 async createCustomTask(createTaskDto: CreateTaskDto) {
   return this.taskModel.create(createTaskDto);
 }

 async assignTask(assignTaskDto: AssignTaskDto) {
   const task = await this.taskModel.create(assignTaskDto);
   await this.childModel.findByIdAndUpdate(
     assignTaskDto.childId,
     { $push: { assignedTasks: task._id } }
   );
   return task;
 }

 async validateTask(taskId: string) {
   const task = await this.taskModel.findByIdAndUpdate(
     taskId,
     { isValidated: true },
     { new: true }
   );

   if (!task) {
     throw new NotFoundException('Task not found');
   }

   if (task.isCompleted) {
     await this.childModel.findByIdAndUpdate(task.childId, {
       $inc: { stars: 5 }
     });
   }

   return task;
 }

 getTaskLibrary() {
   return [
     {
       title: 'Learn Surah Al-Fatiha',
       description: 'Memorize and understand Surah Al-Fatiha',
       level: 1,
       type: 'quran',
       points: 10
     },
     {
       title: 'Daily Prayer Tracker',
       description: 'Track your five daily prayers',
       level: 1,
       type: 'salah',
       points: 5
     },
     {
       title: 'Morning Dua',
       description: 'Learn and recite morning duas',
       level: 1,
       type: 'dua',
       points: 5
     }
   ];
 }
}