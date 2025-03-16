// src/otp/otp.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnsOtpService } from './sns-otp.service';
import { Otp, OtpDocument } from './schemas/otp.schema';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  
  // Track OTP sending attempts with timestamps
  private lastSentTimestamp: Record<string, number> = {};
  private resendAttempts: Record<string, number> = {};

  constructor(
    private readonly snsOtpService: SnsOtpService,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
  ) {}

  /**
   * Generate a random OTP code
   */
  private generateOtpCode(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    
    return otp;
  }

  /**
   * Check if an OTP can be resent based on cooldown periods
   */
  private canResendOtp(contact: string): { allowed: boolean; remainingSeconds: number } {
    const now = Date.now();
    const lastSent = this.lastSentTimestamp[contact] || 0;
    const attempts = this.resendAttempts[contact] || 0;
    
    // Implement progressive backoff based on number of attempts
    let cooldownPeriod = 0;
    if (attempts === 0) {
      // First attempt - no cooldown
      cooldownPeriod = 0;
    } else if (attempts === 1) {
      // Second attempt - 30 seconds
      cooldownPeriod = 30 * 1000;
    } else if (attempts === 2) {
      // Third attempt - 2 minutes
      cooldownPeriod = 2 * 60 * 1000;
    } else {
      // Fourth+ attempts - 5 minutes
      cooldownPeriod = 5 * 60 * 1000;
    }
    
    const timeSinceLastSent = now - lastSent;
    const remainingTime = cooldownPeriod - timeSinceLastSent;
    
    if (remainingTime <= 0) {
      return { allowed: true, remainingSeconds: 0 };
    } else {
      return { allowed: false, remainingSeconds: Math.ceil(remainingTime / 1000) };
    }
  }

  /**
   * Reset the cooldown tracking for a contact
   */
  private resetCooldown(contact: string): void {
    delete this.lastSentTimestamp[contact];
    delete this.resendAttempts[contact];
  }

  /**
   * Create and send an OTP to a phone number
   */
  async createAndSendOtpSms(phoneNumber: string): Promise<boolean> {
    try {
      // Check if we can send a new OTP
      const resendCheck = this.canResendOtp(phoneNumber);
      if (!resendCheck.allowed) {
        throw new BadRequestException(
          `Please wait ${resendCheck.remainingSeconds} seconds before requesting another code`
        );
      }
      
      // Generate OTP code
      const otpCode = this.generateOtpCode();
      
      // Calculate expiry time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      // Save OTP to database
      await this.otpModel.findOneAndUpdate(
        { phoneNumber },
        { 
          code: otpCode,
          expiresAt,
          attempts: 0,
          verified: false
        },
        { upsert: true, new: true }
      );
      
      // Send OTP via SNS
      await this.snsOtpService.sendOtpSms(phoneNumber, otpCode);
      
      // Update tracking for rate limiting
      const attempts = this.resendAttempts[phoneNumber] || 0;
      this.lastSentTimestamp[phoneNumber] = Date.now();
      this.resendAttempts[phoneNumber] = attempts + 1;
      
      return true;
    } catch (error) {
      this.logger.error(`Error creating OTP for ${phoneNumber}:`, error);
      
      // Re-throw BadRequestException without modification
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new Error(`Failed to create and send OTP: ${error.message}`);
    }
  }

  /**
   * Create and send an OTP to an email
   */
  async createAndSendOtpEmail(email: string): Promise<boolean> {
    try {
      // Check if we can send a new OTP
      const resendCheck = this.canResendOtp(email);
      if (!resendCheck.allowed) {
        throw new BadRequestException(
          `Please wait ${resendCheck.remainingSeconds} seconds before requesting another code`
        );
      }
      
      // Generate OTP code
      const otpCode = this.generateOtpCode();
      
      // Calculate expiry time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);
      
      // Save OTP to database
      await this.otpModel.findOneAndUpdate(
        { email },
        { 
          code: otpCode,
          expiresAt,
          attempts: 0,
          verified: false
        },
        { upsert: true, new: true }
      );
      
      // Send OTP via SNS
      await this.snsOtpService.sendOtpEmail(email, otpCode);
      
      // Update tracking for rate limiting
      const attempts = this.resendAttempts[email] || 0;
      this.lastSentTimestamp[email] = Date.now();
      this.resendAttempts[email] = attempts + 1;
      
      return true;
    } catch (error) {
      this.logger.error(`Error creating OTP for ${email}:`, error);
      
      // Re-throw BadRequestException without modification
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new Error(`Failed to create and send OTP: ${error.message}`);
    }
  }

  /**
   * Verify an OTP code
   */
  async verifyOtp(contact: string, code: string): Promise<boolean> {
    try {
      // Determine if contact is email or phone
      const isEmail = contact.includes('@');
      
      // Find the OTP in the database
      const otp = await this.otpModel.findOne({
        ...(isEmail ? { email: contact } : { phoneNumber: contact }),
        expiresAt: { $gt: new Date() }, // Not expired
      });
      
      if (!otp) {
        return false; // No valid OTP found
      }
      
      // Update attempt count
      otp.attempts += 1;
      
      // Check if max attempts exceeded
      if (otp.attempts >= 5) {
        otp.verified = false;
        await otp.save();
        return false;
      }
      
      // Check if code matches
      if (otp.code === code) {
        otp.verified = true;
        await otp.save();
        
        // Reset cooldown on successful verification
        this.resetCooldown(contact);
        
        return true;
      }
      
      // Code doesn't match
      await otp.save();
      return false;
    } catch (error) {
      this.logger.error(`Error verifying OTP for ${contact}:`, error);
      throw new Error(`Failed to verify OTP: ${error.message}`);
    }
  }

  /**
   * Check if a contact has a verified OTP
   */
  async isVerified(contact: string): Promise<boolean> {
    try {
      // Determine if contact is email or phone
      const isEmail = contact.includes('@');
      
      // Find the OTP in the database
      const otp = await this.otpModel.findOne({
        ...(isEmail ? { email: contact } : { phoneNumber: contact }),
        verified: true,
        expiresAt: { $gt: new Date() }, // Not expired
      });
      
      return !!otp;
    } catch (error) {
      this.logger.error(`Error checking verification for ${contact}:`, error);
      throw new Error(`Failed to check verification: ${error.message}`);
    }
  }
}