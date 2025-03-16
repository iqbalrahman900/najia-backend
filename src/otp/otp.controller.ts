// src/otp/otp.controller.ts
import { Controller, Post, Body, HttpException, HttpStatus, Get, Param, Logger } from '@nestjs/common';
import { OtpService } from './otp.service';
import { FirebaseService } from '../firebase/firebase.service';

@Controller('otp')
export class OtpController {
  private readonly logger = new Logger(OtpController.name);
  
  constructor(
    private readonly otpService: OtpService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post('send-phone')
  async sendOtpToPhone(@Body('phoneNumber') phoneNumber: string) {
    try {
      if (!phoneNumber) {
        throw new HttpException('Phone number is required', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.otpService.createAndSendOtpSms(phoneNumber);
      
      return {
        success: result,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send OTP', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('send-email')
  async sendOtpToEmail(@Body('email') email: string) {
    try {
      if (!email) {
        throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.otpService.createAndSendOtpEmail(email);
      
      return {
        success: result,
        message: 'OTP sent successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send OTP', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('verify')
  async verifyOtp(
    @Body('contact') contact: string,
    @Body('code') code: string,
  ) {
    try {
      if (!contact || !code) {
        throw new HttpException('Contact and code are required', HttpStatus.BAD_REQUEST);
      }
      
      const isVerified = await this.otpService.verifyOtp(contact, code);
      
      if (!isVerified) {
        return {
          success: false,
          message: 'Invalid or expired OTP',
        };
      }
      
      try {
        // Create a sanitized UID from the phone number
        const uid = `user_${contact.replace(/[^\w]/g, '_')}`;
        
        // Custom claims for the token
        const customClaims = {
          phoneNumber: contact,
          provider: 'phone',
          createdAt: new Date().toISOString()
        };
        
        // Use the Firebase service to generate the token
        const token = await this.firebaseService.createCustomToken(uid, customClaims);
        
        this.logger.log(`Created Firebase token for user: ${uid}`);
        
        return {
          success: true,
          message: 'OTP verified successfully',
          token: token
        };
      } catch (firebaseError) {
        this.logger.error(`Firebase token creation error: ${firebaseError.message}`);
        throw new HttpException(
          'Authentication error after OTP verification', 
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      this.logger.error(`OTP verification error: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to verify OTP', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('check/:contact')
  async checkVerification(@Param('contact') contact: string) {
    try {
      if (!contact) {
        throw new HttpException('Contact is required', HttpStatus.BAD_REQUEST);
      }
      
      const isVerified = await this.otpService.isVerified(contact);
      
      return {
        verified: isVerified,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to check verification', 
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}