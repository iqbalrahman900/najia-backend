// task/dto/create-task.dto.ts
import { IsString, IsNumber, IsEnum } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNumber()
  level: number;

  @IsEnum(['dua', 'salah', 'quran', 'quiz'])
  type: string;

  @IsNumber()
  points: number;
}