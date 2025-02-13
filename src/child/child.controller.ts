import { Controller, Get, Patch, Param, UseGuards, Post, Body } from '@nestjs/common';
import { ChildService } from './child.service';
import { Public } from '../decorators/public.decorator';
import { CompleteTaskDto } from './dto/complete-task.dto';

@Controller('child')
export class ChildController {
  constructor(private readonly childService: ChildService) {}

  @Post('login')
  @Public()
  async login(@Body() { loginCode }: { loginCode: string }) {
    return this.childService.login(loginCode);
  }

  @Get('dashboard/:uniqueId')
  @Public()
  async getChildDashboard(@Param('uniqueId') uniqueId: string) {
    return this.childService.getChildDashboard(uniqueId);
  }

  @Patch('task/complete')
  async completeTask(@Body() completeTaskDto: CompleteTaskDto) {
    return this.childService.completeTask(completeTaskDto);
  }

  @Get('progress/:uniqueId')
  async getProgress(@Param('uniqueId') uniqueId: string) {
    return this.childService.getProgress(uniqueId);
  }
}