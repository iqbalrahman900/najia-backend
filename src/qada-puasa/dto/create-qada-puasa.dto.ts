// qada-puasa/dto/create-qada-puasa.dto.ts
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateQadaPuasaDto {
 @IsNumber()
 @IsNotEmpty()
 totalYears: number;
}