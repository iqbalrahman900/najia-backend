// src/otp/otp.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { OtpService } from './otp.service';
import { SnsOtpService } from './sns-otp.service';
import { OtpController } from './otp.controller';
import { Otp, OtpSchema } from './schemas/otp.schema';
import { FirebaseModule } from '../firebase/firebase.module'; // Add this import

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Otp.name, schema: OtpSchema }
    ]),
    FirebaseModule, // Add this import
  ],
  controllers: [OtpController],
  providers: [OtpService, SnsOtpService],
  exports: [OtpService],
})
export class OtpModule {}