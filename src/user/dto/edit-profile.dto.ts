// user/dto/edit-profile.dto.ts
import { IsString, IsEmail, IsOptional, IsDateString } from 'class-validator';

export class EditProfileDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}