// src/guardian/dto/link-child.dto.ts
import { IsNotEmpty, IsString } from 'class-validator';

export class LinkChildDto {
  @IsNotEmpty()
  @IsString()
  childId: string;

  @IsNotEmpty()
  @IsString()
  loginCode: string;
}
