// user/dto/complete-profile.dto.ts
import { IsEmail, IsNotEmpty, IsDateString, IsEnum } from 'class-validator';

export class CompleteProfileDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @IsNotEmpty()
  @IsEnum(['male', 'female', 'other'], { message: 'Gender must be either male, female, or other' })
  gender: string;
}