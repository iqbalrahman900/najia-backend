// src/auth/auth.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthGuard } from './guards/auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { OtpModule } from '../otp/otp.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [
    forwardRef(() => UserModule),
    OtpModule,
    FirebaseModule,  // Add Firebase module
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: configService.get<string>('JWT_EXPIRATION', '86400s')
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthGuard, 
    JwtAuthGuard,
    FirebaseAuthGuard,  // Add Firebase Auth Guard
    JwtStrategy
  ],
  exports: [
    AuthService,
    AuthGuard, 
    JwtAuthGuard,
    FirebaseAuthGuard,  // Export Firebase Auth Guard
    JwtModule
  ],
})
export class AuthModule {}