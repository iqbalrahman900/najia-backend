// src/guardian/guardian.controller.ts
import { Controller, Get, Post, Body, Param, Delete, UseGuards, NotFoundException, Patch } from '@nestjs/common';
import { GuardianService } from './guardian.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { User } from '../decorators/user.decorator';
import { CreateChildDto } from './dto/create-child.dto';
import { LinkChildDto } from './dto/link-child.dto';
import { AssignTaskDto } from './dto/assign-task.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Controller('guardian')
@UseGuards(AuthGuard)
export class GuardianController {
  constructor(private readonly guardianService: GuardianService,  @InjectModel('User') private userModel: Model<any>) {}

  @Post('role')
  async setRole(
    @User('uid') firebaseUid: string, // This gets Firebase UID from token
    @Body('role') role: string
  ) {
    console.log('Setting role for user:', { firebaseUid, role });
    return await this.guardianService.setRole(firebaseUid, role);
  }
  

  @Post('child')
  async addChild(
    @User('uid') userId: string,
    @Body() createChildDto: CreateChildDto
  ) {
    console.log('Controller received userId:', userId); // Debug log
    return await this.guardianService.addChild(userId, createChildDto);
  }

  @Post('child/link')
  linkChildAccount(
    @User('uid') userId: string,
    @Body() linkChildDto: LinkChildDto
  ) {
    return this.guardianService.linkChildAccount(linkChildDto.loginCode, userId);
  }

 @Get('children')
  async getChildren(@User('uid') firebaseUid: string) {
    return await this.guardianService.getChildren(firebaseUid);
  }

  @Delete('child/:childId')
  removeChild(
    @User('uid') guardianId: string,
    @Param('childId') childId: string
  ) {
    return this.guardianService.removeChild(guardianId, childId);
  }

  @Get('child/details')
  getChildDetails(@User('uid') userId: string) {
    return this.guardianService.getChildDetails(userId);
  }

  @Get('role')
  getRole(@User('uid') userId: string) {
    return this.guardianService.getRole(userId);
  }

  @Post('tasks')
async assignTask(
  @User('uid') firebaseUid: string,
  @Body() assignTaskDto: AssignTaskDto,
) {
  try {
    // Get user from firebase UID
    const user = await this.userModel.findOne({ firebaseUid });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    console.log('Assigning task for user:', {
      firebaseUid,
      userId: user._id.toString()
    });

    // Pass user._id as parentId to service
    return await this.guardianService.assignTask(user._id.toString(), assignTaskDto);
  } catch (error) {
    console.error('Error in assignTask controller:', error);
    throw error;
  }

  
}


  @Get('tasks')
  async getTasks(@User('uid') firebaseUid: string) {
    try {
      const user = await this.userModel.findOne({ firebaseUid });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      return await this.guardianService.getTasks(firebaseUid);
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  @Patch('tasks/:taskId/validate')
async validateTask(
  @User('uid') firebaseUid: string,
  @Param('taskId') taskId: string,
) {
  const user = await this.userModel.findOne({ firebaseUid });
  if (!user) {
    throw new NotFoundException('User not found');
  }

  return await this.guardianService.validateTask(taskId, user._id.toString());
}



}