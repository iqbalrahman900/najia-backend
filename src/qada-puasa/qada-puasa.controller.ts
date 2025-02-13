// qada-puasa/qada-puasa.controller.ts
import { Controller, Post, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { QadaPuasaService } from './qada-puasa.service';
import { CreateQadaPuasaDto } from './dto/create-qada-puasa.dto';
import { RecordQadaDto } from './dto/record-qada.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { User } from '../user/decorators/user.decorator';

@Controller('qada-puasa')
@UseGuards(FirebaseAuthGuard)
export class QadaPuasaController {
 constructor(private readonly qadaPuasaService: QadaPuasaService) {}

 @Post()
 create(@User('uid') userId: string, @Body() createDto: CreateQadaPuasaDto) {
   return this.qadaPuasaService.create(userId, createDto);
 }

 @Patch('progress')
 updateProgress(
   @User('uid') userId: string,
   @Body() recordDto: RecordQadaDto
 ) {
   return this.qadaPuasaService.updateProgress(userId, recordDto);
 }

 @Get('progress')
 getProgress(@User('uid') userId: string) {
   return this.qadaPuasaService.getProgress(userId);
 }

 @Get('history')
 getHistory(@User('uid') userId: string) {
   return this.qadaPuasaService.getHistory(userId);
 }
}