// user/user.controller.ts
import { Controller, Post, Get, Body, UseGuards, Patch, NotFoundException } from '@nestjs/common';
import { UserService } from './user.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from './decorators/user.decorator';
import { EditProfileDto } from './dto/edit-profile.dto';

@Controller('users')
@UseGuards(FirebaseAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Post('register')
  async register(
    @User('uid') firebaseUid: string,
    @Body('phoneNumber') phoneNumber: string,
  ) {
    return this.userService.createUser(firebaseUid, phoneNumber);
  }

  @Post('profile')
  async completeProfile(
    @User('uid') firebaseUid: string,
    @Body() profileData: CompleteProfileDto,
  ) {
    const updatedUser = await this.userService.completeProfile(firebaseUid, profileData);
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  @Get('profile')
  async getProfile(@User('uid') firebaseUid: string) {
    const user = await this.userService.getUserProfile(firebaseUid);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Patch('profile')
  async editProfile(
    @User('uid') firebaseUid: string,
    @Body() profileData: EditProfileDto,
  ) {
    return this.userService.editProfile(firebaseUid, profileData);
  }

  @Patch('upgrade')
  async upgradeAccount(@User('uid') firebaseUid: string) {
    const updatedUser = await this.userService.updateAccountType(firebaseUid, 'premium');
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }
}