// src/guardian/guardian.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GuardianController } from './guardian.controller';
import { GuardianService } from './guardian.service';
import { Child, ChildSchema } from './entities/child.entity';
import { Guardian, GuardianSchema } from './entities/guardian.entity';
import { User, UserSchema } from '../user/schemas/user.schema'; // Import User model
import { Task, TaskSchema } from './entities/task.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Child.name, schema: ChildSchema },
      { name: Guardian.name, schema: GuardianSchema },
      { name: User.name, schema: UserSchema }, // Add User model
      { name: Task.name, schema: TaskSchema },
    ]),
  ],
  controllers: [GuardianController],
  providers: [GuardianService],
})
export class GuardianModule {}