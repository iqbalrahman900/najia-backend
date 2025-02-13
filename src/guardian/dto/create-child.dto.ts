// src/guardian/dto/create-child.dto.ts
import { IsNotEmpty, IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateChildDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(17)
  age: number;
}