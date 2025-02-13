// daily-worship.controller.ts
import { Controller, Post, Body, Get, UseGuards, Param, NotFoundException, Query, Req } from '@nestjs/common';
import { DailyWorshipService } from './daily-worship.service';
import { RecordSelawatDto } from './dto/record-selawat.dto';
import { RecordIstigfarDto } from './dto/record-istigfar.dto';
import { RecordQuranDto } from './dto/record-quran.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../decorators/user.decorator';
import { UserService } from '../user/user.service';

@Controller('daily-worship')
@UseGuards(FirebaseAuthGuard)
export class DailyWorshipController {
  constructor(
    private readonly dailyWorshipService: DailyWorshipService,
    private readonly userService: UserService
  ) {}

  // Helper method to get MongoDB user ID
  private async getMongoUserId(firebaseUid: string): Promise<string> {
    try {
      const user = await this.userService.findByFirebaseUid(firebaseUid);
      return user._id.toString();
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  @Post('selawat')
  async recordSelawat(
    @User('uid') firebaseUid: string,
    @Body() dto: RecordSelawatDto,
  ) {
    const userId = await this.getMongoUserId(firebaseUid);
    return this.dailyWorshipService.recordSelawat(userId, dto);
  }

  @Post('istigfar')
  async recordIstigfar(
    @User('uid') firebaseUid: string,
    @Body() dto: RecordIstigfarDto,
  ) {
    const userId = await this.getMongoUserId(firebaseUid);
    return this.dailyWorshipService.recordIstigfar(userId, dto);
  }

  @Post('quran')
  async recordQuran(
    @User('uid') firebaseUid: string,
    @Body() dto: RecordQuranDto,
  ) {
    const userId = await this.getMongoUserId(firebaseUid);
    return this.dailyWorshipService.recordQuran(userId, dto);
  }

  @Get('daily')
  async getDailyProgress(@User('uid') firebaseUid: string) {
    const userId = await this.getMongoUserId(firebaseUid);
    return this.dailyWorshipService.getDailyProgress(userId);
  }

  @Get('weekly')
  async getWeeklyProgress(@User('uid') firebaseUid: string) {
    const userId = await this.getMongoUserId(firebaseUid);
    return this.dailyWorshipService.getWeeklyProgress(userId);
  }

  @Get('monthly')
  async getMonthlyProgress(
    @User('uid') firebaseUid: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const userId = await this.getMongoUserId(firebaseUid);
    
    // Convert string parameters to numbers if provided
    const targetMonth = month ? parseInt(month, 10) : undefined;
    const targetYear = year ? parseInt(year, 10) : undefined;

    // Validate month value if provided
    if (targetMonth !== undefined && (targetMonth < 0 || targetMonth > 11)) {
      throw new Error('Month must be between 0 and 11');
    }

    return this.dailyWorshipService.getMonthlyProgress(userId, targetMonth, targetYear);
  }


    @Get('leaderboard/weekly')
    getWeeklyLeaderboard() {
      return this.dailyWorshipService.getWeeklyLeaderboard();
    }

  @Get('leaderboard/monthly')
  getMonthlyLeaderboard() {
    return this.dailyWorshipService.getMonthlyLeaderboard();
  }

  @Get('leaderboard/:type/rank')
  async getUserRank(
    @User('uid') firebaseUid: string,
    @Param('type') type: 'weekly' | 'monthly',
  ) {
    const userId = await this.getMongoUserId(firebaseUid);
    return this.dailyWorshipService.getUserRank(userId, type);
  }


  
}