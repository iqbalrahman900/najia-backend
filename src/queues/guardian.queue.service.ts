// src/queues/guardian.queue.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AssignTaskDto } from 'src/task/dto/assign-task.dto';

@Injectable()
export class GuardianQueueService {
  constructor(@InjectQueue('guardian') private guardianQueue: Queue) {}

  async addAssignTaskJob(userId: string, assignTaskDto: AssignTaskDto) {
    return this.guardianQueue.add('assignTask', 
      { userId, assignTaskDto },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true
      }
    );
  }

  async addValidateTaskJob(taskId: string, userId: string) {
    return this.guardianQueue.add('validateTask', 
      { taskId, userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
      }
    );
  }
}