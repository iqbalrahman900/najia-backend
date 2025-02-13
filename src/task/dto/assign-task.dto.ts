// task/dto/assign-task.dto.ts
import { IsString, IsNumber } from 'class-validator';

export class AssignTaskDto {
    @IsString()
    childId: string;
   
    @IsString()
    title: string;
   
    @IsString()
    description: string;
   
    @IsNumber()
    level: number;
   
    @IsString()
    type: string;
   }