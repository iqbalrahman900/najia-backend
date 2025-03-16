// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../otp/otp.service';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private otpService: OtpService,
    private userService: UserService,
  ) {}

  // Request OTP
  async requestOtp(phoneNumber: string): Promise<{ message: string }> {
    await this.otpService.createAndSendOtpSms(phoneNumber);
    return { message: 'OTP sent successfully' };
  }

  // Verify OTP and create or update user
  async verifyOtpAndLogin(phoneNumber: string, code: string): Promise<{ token: string, isNewUser: boolean, user: any }> {
    // Verify the OTP
    const isVerified = await this.otpService.verifyOtp(phoneNumber, code);
    
    if (!isVerified) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }
    
    // Find or create user
    let user = await this.userService.findByPhone(phoneNumber);
    const isNewUser = !user;
    
    if (!user) {
      // Create new user if not found
      user = await this.userService.createUser(phoneNumber);
    }
    
    // Generate JWT token
    const payload = { 
      sub: user._id.toString(),
      phone: user.phoneNumber,
      ...(user.email && { email: user.email }),
    };
    
    return {
      token: this.jwtService.sign(payload),
      isNewUser,
      user: {
        id: user._id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        name: user.name,
        isProfileComplete: user.isProfileComplete,
        accountType: user.accountType
      }
    };
  }
}