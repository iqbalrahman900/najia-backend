// user/user.controller.ts
import { Controller, Post, Get, Body, UseGuards, Patch, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../decorators/user.decorator';
import { EditProfileDto } from './dto/edit-profile.dto';
import { Public } from '../decorators/public.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  @Public() // Public endpoint - doesn't require JWT
  async register(@Body('phoneNumber') phoneNumber: string) {
    return this.userService.createUser(phoneNumber);
  }

  @Post('profile')
  async completeProfile(
    @User('userId') userId: string,
    @Body() profileData: CompleteProfileDto,
  ) {
    const updatedUser = await this.userService.completeProfile(userId, profileData);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  @Get('profile')
  async getProfile(@User('userId') userId: string) {
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
    return this.userService.editProfile(userId, profileData);
  }

  @Patch('upgrade')
  async upgradeAccount(@User('userId') userId: string) {
    const updatedUser = await this.userService.updateAccountType(userId, 'premium');
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }
}