// child/dto/complete-task.dto.ts
import { IsString } from 'class-validator';

export class CompleteTaskDto {
    @IsString()
    taskId: string;
   
    @IsString()
    childId: string;
   }