// src/parent/parent.controller.ts
import { Controller, Post, Get, Patch, Body, Param, UseGuards, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ParentService } from './parent.service';
import { CreateChildDto } from './dto/create-child.dto';
import { AssignTaskDto } from '../task/dto/assign-task.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { User } from '../user/decorators/user.decorator';

@Controller('parent')
@UseGuards(AuthGuard)
export class ParentController {
  private readonly logger = new Logger(ParentController.name);

  constructor(private readonly parentService: ParentService) {}

  @Get('debug-auth')
  async debugAuth(@User() user: any) {
    this.logger.log('Debug auth for user:', user);
    
    try {
      const firebaseUser = await admin.auth().getUser(user.uid);
      this.logger.log('Firebase user found:', firebaseUser);
      return {
        success: true,
        user: firebaseUser,
        message: 'Firebase user found'
      };
    } catch (error) {
      this.logger.error('Firebase auth error:', error);
      return {
        success: false,
        error: error.message,
        userProvided: user
      };
    }
  }

  @Post('child')
  async createChild(@Body() createChildDto: CreateChildDto, @User() user: any) {
    this.logger.log(`Creating child for parent: ${user.uid}`);
    this.logger.debug('Create child DTO:', createChildDto);
    
    try {
      // Verify Firebase user exists before creating child
      await admin.auth().getUser(user.uid);
      
      createChildDto.parentId = user.uid;
      return this.parentService.createChild(createChildDto);
    } catch (error) {
      this.logger.error('Error verifying Firebase user:', error);
      throw error;
    }
  }

  @Get('dashboard')
  async getParentDashboard(@User() user: any) {
    this.logger.log(`Fetching dashboard for parent: ${user.uid}`);
    try {
      // Verify Firebase user exists before fetching dashboard
      await admin.auth().getUser(user.uid);
      return this.parentService.getParentDashboard(user.uid);
    } catch (error) {
      this.logger.error('Error fetching dashboard:', error);
      throw error;
    }
  }

  @Post('task/assign')
  async assignTask(@Body() assignTaskDto: AssignTaskDto, @User() user: any) {
    this.logger.log('Assigning task:', assignTaskDto);
    this.logger.log('Parent ID:', user.uid);
    return this.parentService.assignTask(assignTaskDto);
  }

  @Patch('task/validate/:taskId')
  async validateTask(@Param('taskId') taskId: string, @User() user: any) {
    this.logger.log(`Validating task: ${taskId}`);
    this.logger.log('Parent ID:', user.uid);
    return this.parentService.validateTask(taskId);
  }
}