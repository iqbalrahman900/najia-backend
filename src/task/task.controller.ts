// src/task/task.controller.ts
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { AuthGuard } from '../auth/guards/auth.guard';

@Controller('task')
@UseGuards(AuthGuard)
export class TaskController {
 constructor(private readonly taskService: TaskService) {}

 @Get('library')
 async getTaskLibrary() {
   return this.taskService.getTaskLibrary();
 }

 @Post('custom')
 async createCustomTask(@Body() createTaskDto: CreateTaskDto) {
   return this.taskService.createCustomTask(createTaskDto);
 }
}