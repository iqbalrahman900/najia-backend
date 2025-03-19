// qada-puasa/qada-puasa.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QadaPuasaController } from './qada-puasa.controller';
import { QadaPuasaService } from './qada-puasa.service';
import { QadaPuasa, QadaPuasaSchema } from './schemas/qada-puasa.schema';
import { User, UserSchema } from '../user/schemas/user.schema';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [
    FirebaseModule,
    MongooseModule.forFeature([
      { name: QadaPuasa.name, schema: QadaPuasaSchema },
      { name: User.name, schema: UserSchema }
    ]),
  ],
  controllers: [QadaPuasaController],
  providers: [QadaPuasaService],
})
export class QadaPuasaModule {}