// daily-worship/daily-worship.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyWorshipController } from './daily-worship.controller';
import { DailyWorshipService } from './daily-worship.service';
import { WorshipRecord, WorshipRecordSchema } from './schemas/worship-record.schema';
import { UserModule } from '../user/user.module';  // Add this import
import { User, UserSchema } from 'src/user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WorshipRecord.name, schema: WorshipRecordSchema },
      { name: User.name, schema: UserSchema }
      
    ]),
    UserModule,  // Add this import
  ],
  controllers: [DailyWorshipController],
  providers: [DailyWorshipService],
  exports: [DailyWorshipService],
})
export class DailyWorshipModule {}