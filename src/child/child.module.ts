// child/child.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Child, ChildSchema } from './schemas/child.schema';
import { Task, TaskSchema } from '../task/schemas/task.schema';
import { ChildController } from './child.controller';
import { ChildService } from './child.service';

@Module({
    imports: [
      MongooseModule.forFeature([
        { name: Child.name, schema: ChildSchema },
        { name: Task.name, schema: TaskSchema }
      ])
    ],
    controllers: [ChildController],
    providers: [ChildService]
   })
   export class ChildModule {}