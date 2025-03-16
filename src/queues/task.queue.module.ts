// src/queues/task.queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TaskQueueProcessor } from './task.queue.processor';
import { TaskQueueService } from './task.queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'tasks',
    }),
  ],
  providers: [TaskQueueProcessor, TaskQueueService],
  exports: [TaskQueueService],
})
export class TaskQueueModule {}