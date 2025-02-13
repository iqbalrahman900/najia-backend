// qada/qada.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QadaController } from './qada.controller';
import { QadaService } from './qada.service';
import { QadaTracker, QadaTrackerSchema } from './schemas/qada.schema';
import { User, UserSchema } from '../user/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: QadaTracker.name, schema: QadaTrackerSchema },
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [QadaController],
  providers: [QadaService],
})
export class QadaModule {}