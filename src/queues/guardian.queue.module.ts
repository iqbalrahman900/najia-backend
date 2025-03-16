// src/queues/guardian.queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { GuardianQueueProcessor } from './guardian.queue.processor';
import { GuardianQueueService } from './guardian.queue.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'guardian',
    }),
  ],
  providers: [GuardianQueueProcessor, GuardianQueueService],
  exports: [GuardianQueueService],
})
export class GuardianQueueModule {}