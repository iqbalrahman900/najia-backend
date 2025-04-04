import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Task, TaskSchema } from './schemas/task.schema';
import { Child, ChildSchema } from '../child/schemas/child.schema';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
      AuthModule,
      MongooseModule.forFeature([
        { name: Task.name, schema: TaskSchema },
        { name: Child.name, schema: ChildSchema }
      ])
    ],
    controllers: [TaskController], 
    providers: [TaskService]
   })
   export class TaskModule {}