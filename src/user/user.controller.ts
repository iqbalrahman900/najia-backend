import { Controller, Post, Get, Body, UseGuards, Patch, NotFoundException, Headers, Logger } from '@nestjs/common';
import { UserService } from './user.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { EditProfileDto } from './dto/edit-profile.dto';
import { Public } from '../decorators/public.decorator';
import { FirebaseAuthGuard } from 'src/auth/firebase-auth.guard';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  private readonly logger = new Logger(UserController.name);
  
  constructor(private readonly userService: UserService) { }

  @Post('register')
  @Public() // Public endpoint - doesn't require JWT
  async register(
    @Body('phoneNumber') phoneNumber: string,
    @Body('firebaseUid') firebaseUid?: string,
    @Headers('authorization') authHeader?: string
  ) {
    // Log the incoming request
    this.logger.log(`Registering user with phone: ${phoneNumber}, Firebase UID: ${firebaseUid}`);
    
    // Log if an auth token was provided
    if (authHeader) {
      this.logger.log('Auth token provided with registration request');
    }
    
    try {
      const user = await this.userService.createUser(phoneNumber, firebaseUid);
      this.logger.log(`User registered successfully: ${user._id}`);
      return {
        success: true,
        message: 'User registered successfully',
        user: {
          id: user._id,
          phoneNumber: user.phoneNumber,
          isProfileComplete: user.isProfileComplete
        }
      };
    } catch (error) {
      this.logger.error(`Registration error: ${error.message}`);
      throw error;
    }
  }

  @Post('profile')
  async completeProfile(
    @User('userId') userId: string,
    @Body() profileData: CompleteProfileDto,
  ) {
    this.logger.log(`Completing profile for user: ${userId}`);
    
    const updatedUser = await this.userService.completeProfile(userId, profileData);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    
    this.logger.log(`Profile completed successfully for user: ${userId}`);
    return updatedUser;
  }

  @Get('profile')
  async getProfile(@User('userId') userId: string) {
    this.logger.log(`Getting profile for user: ${userId}`);
    
    const user = await this.userService.getUserProfile(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  @Patch('profile')
  async editProfile(
    @User('userId') userId: string,
    @Body() profileData: EditProfileDto,
  ) {
    this.logger.log(`Editing profile for user: ${userId}`);
    return this.userService.editProfile(userId, profileData);
  }

  @Patch('upgrade')
  async upgradeAccount(@User('userId') userId: string) {
    this.logger.log(`Upgrading account for user: ${userId}`);
    
    const updatedUser = await this.userService.updateAccountType(userId, 'premium');
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    
    this.logger.log(`Account upgraded successfully for user: ${userId}`);
    return updatedUser;
  }
}