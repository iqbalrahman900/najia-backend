// qada/qada.controller.ts
import { Controller, Post, Body, Get, Patch, UseGuards } from '@nestjs/common';
import { QadaService } from './qada.service';
import { CreateQadaDto } from './dto/create-qada.dto';
import { UpdateQadaDto } from './dto/update-qada.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../user/decorators/user.decorator';

@Controller('qada')
@UseGuards(FirebaseAuthGuard)
export class QadaController {
 constructor(private readonly qadaService: QadaService) {}

 @Post()
 create(@User('uid') userId: string, @Body() createQadaDto: CreateQadaDto) {
   return this.qadaService.create(userId, createQadaDto);
 }

 @Patch('progress')
 updateProgress(
   @User('uid') userId: string,
   @Body() updateQadaDto: UpdateQadaDto,
 ) {
   return this.qadaService.updateProgress(userId, updateQadaDto.prayerType);
 }

 @Get('progress')
 getProgress(@User('uid') userId: string) {
   return this.qadaService.getProgress(userId);
 }

 @Post('reset')
 resetProgress(@User('uid') userId: string) {
   return this.qadaService.resetProgress(userId);
 }
}