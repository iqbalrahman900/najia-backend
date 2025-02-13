// daily-worship/dto/record-quran.dto.ts
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordQuranDto{
  @IsNumber()
  @Min(1)
  minutes: number;

  @IsString()
  @IsOptional()
  notes?: string;
}