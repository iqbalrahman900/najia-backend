// src/guardian/dto/create-guardian.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';

export class CreateGuardianDto {
  @IsNotEmpty()
  @IsEnum(['guardian', 'child'])
  role: string;
}