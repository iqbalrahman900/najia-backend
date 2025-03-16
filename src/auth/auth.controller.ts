// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from '../decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('request-otp')
  @Public()
  async requestOtp(@Body('phoneNumber') phoneNumber: string) {
    try {
      return await this.authService.requestOtp(phoneNumber);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send OTP',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify-otp')
  @Public()
  async verifyOtp(
    @Body('phoneNumber') phoneNumber: string,
    @Body('code') code: string,
  ) {
    try {
      return await this.authService.verifyOtpAndLogin(phoneNumber, code);
    } catch (error) {
      throw new HttpException(
        error.message || 'Verification failed',
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}