// dto/record-selawat.dto.ts
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';


export class RecordSelawatDto  {
  @IsNumber()
  @Min(1)
  count: number;

  @IsString()
  @IsOptional()
  notes?: string;
}