// src/s3/s3.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Controller } from './s3.controller';
import { S3Service } from './s3.service';
import { AuthModule } from '../auth/auth.module'; // Add this import

@Module({
  imports: [
    ConfigModule,
    AuthModule, // Import the AuthModule to make JwtService available
  ],
  controllers: [S3Controller],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}