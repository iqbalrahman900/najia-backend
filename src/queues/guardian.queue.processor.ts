// src/queues/guardian.queue.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TaskDocument } from 'src/task/schemas/task.schema';
import { ChildDocument } from 'src/guardian/entities/child.entity';

@Processor('guardian')
export class GuardianQueueProcessor {
  constructor(
    @InjectModel('Task') private taskModel: Model<TaskDocument>,
    @InjectModel('Child') private childModel: Model<ChildDocument>,
  ) {}

//   @Process('assignTask')
//   async handleAssignTask(job: Job<{ userId: string; assignTaskDto: AssignTaskDto }>) {
//     const { userId, assignTaskDto } = job.data;
    
//     const parentId = new Types.ObjectId(userId);
//     const childId = new Types.ObjectId(assignTaskDto.childId);
    
//     // Verify parent-child relationship
//     const child = await this.childModel.findOne({
//       _id: childId,
//       parentId: parentId,
//       isActive: true
//     }).exec();

//     if (!child) {
//       throw new Error('Child not found or does not belong to parent');
//     }

//     // Prepare task data
//     const taskData = {
//       parentId,
//       childId,
//       title: assignTaskDto.title,
//       description: assignTaskDto.description,
//       type: assignTaskDto.type,
//       level: assignTaskDto.level || 1,
//       points: assignTaskDto.points || 0,
//       assignedDate: new Date(),
//       duration: assignTaskDto.duration || TaskDuration.DAILY,
//       isCompleted: false,
//       isValidated: false,
//       isActive: true,
//       badges: [],
//       rewardType: assignTaskDto.reward.type,
//       rewardDescription: assignTaskDto.reward.description,
//       rewardPoints: assignTaskDto.reward.points || 0
//     };

//     // Save task and update child in transaction
//     const taskDocument = new this.taskModel(taskData);
//     const savedTask = await taskDocument.save();

//     await this.childModel.findByIdAndUpdate(
//       childId,
//       { $push: { assignedTasks: savedTask._id } },
//       { new: true }
//     );

//     return savedTask;
//   }

  @Process('validateTask')
  async handleValidateTask(job: Job) {
    const { taskId, userId } = job.data;
    // Your existing validateTask logic
  }
}