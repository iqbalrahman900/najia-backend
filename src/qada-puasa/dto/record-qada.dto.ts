// qada-puasa/dto/record-qada.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class RecordQadaDto {
 @IsOptional()
 @IsString()
 notes?: string;
}