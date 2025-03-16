// src/queues/task.queue.processor.ts
import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

@Processor('tasks')
export class TaskQueueProcessor {
  private readonly logger = new Logger(TaskQueueProcessor.name);

  @Process('processTask')
  async handleTask(job: Job) {
    this.logger.debug('Processing task...');
    this.logger.debug(job.data);
    
    try {
      // Process your task here
      await this.processTask(job.data);
      
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing task: ${error.message}`);
      throw error;
    }
  }

  private async processTask(data: any) {
    // Implement your task processing logic here
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate work
  }
}