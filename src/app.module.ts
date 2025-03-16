// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { QadaModule } from './qada/qada.module';
import { QadaPuasaModule } from './qada-puasa/qada-puasa.module';
import { PaymentModule } from './payment/payment.module';
import { TaskModule } from './task/task.module';
import { ParentModule } from './parent/parent.module';
import { ChildModule } from './child/child.module';
import { ContactModule } from './contact/contact.module';
import { DailyWorshipModule } from './ daily-worship/daily-worship.module';
import { GuardianModule } from './guardian/guardian.module';
import { GroceriesModule } from './groceries/groceries.module';
import { S3Module } from './s3/s3.module';
import { OtpModule } from './otp/otp.module';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/najia_app',
        serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
        autoIndex: true, // Build indexes
        maxPoolSize: 10, // Maintain up to 10 socket connections
        connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
        socketTimeoutMS: 45000, // Close ockets after 45 seconds of inactivity
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    QadaModule,
    QadaPuasaModule,
    PaymentModule,
    TaskModule,
    ParentModule,
    ChildModule,
    ContactModule,
DailyWorshipModule,
    GuardianModule,
    GroceriesModule,
    S3Module,
    OtpModule,
    FirebaseModule,
  ],
})
export class AppModule {}