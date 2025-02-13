import { IsString, IsNumber, IsOptional, Min, Max, IsEnum } from 'class-validator';

export class CreateGroceryRequestDto {
  @IsString()
  userId: string;

  @IsString()
  fullName: string;

  @IsString()
  address: string;

  @IsNumber()
  @Min(1)
  @Max(300)
  amountRequested: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
