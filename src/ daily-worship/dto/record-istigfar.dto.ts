// dto/record-istigfar.dto.ts
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';


export class RecordIstigfarDto {
  @IsNumber()
  @Min(1)
  count: number;

  @IsString()
  @IsOptional()
  notes?: string;
}