// qada/dto/create-qada.dto.ts
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateQadaDto {
 @IsNumber()
 @IsNotEmpty()
 totalYears: number;
}