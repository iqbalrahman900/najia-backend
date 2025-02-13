// src/guardian/dto/respond-guardian.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';

export class RespondGuardianDto {
  @IsNotEmpty()
  @IsEnum(['active', 'rejected'])
  status: string;
}