// parent/parent.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Parent, ParentSchema } from './schemas/parent.schema';
import { Child, ChildSchema } from '../child/schemas/child.schema';
import { Task, TaskSchema } from '../task/schemas/task.schema';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';
import { AuthModule } from '../auth/auth.module';
import { ParentChild, ParentChildSchema } from './schemas/parent-child.schema';

@Module({
    imports: [
      MongooseModule.forFeature([
        { name: ParentChild.name, schema: ParentChildSchema },
        { name: Parent.name, schema: ParentSchema },
        { name: Child.name, schema: ChildSchema },
        { name: Task.name, schema: TaskSchema }  // Add this line
      ]),
      AuthModule
    ],
    controllers: [ParentController],
    providers: [ParentService]
})
export class ParentModule {}