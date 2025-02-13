// src/guardian/dto/assign-task.dto.ts
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskDuration } from '../entities/task.entity';

export class RewardDto {
  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  @IsOptional()
  points?: number;
}

export class AssignTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNumber()
  @IsOptional()
  level?: number;

  @IsNumber()
  @IsOptional()
  points?: number;

  @IsEnum(TaskDuration)
  @IsOptional()
  duration?: TaskDuration = TaskDuration.DAILY;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RewardDto)
  reward: RewardDto;
}