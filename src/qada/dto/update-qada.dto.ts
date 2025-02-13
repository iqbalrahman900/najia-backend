// qada/dto/update-qada.dto.ts
import { IsIn, IsNotEmpty } from 'class-validator';

export class UpdateQadaDto {
 @IsNotEmpty()
 @IsIn(['Subuh', 'Zohor', 'Asar', 'Maghrib', 'Isya'])
 prayerType: string;
}