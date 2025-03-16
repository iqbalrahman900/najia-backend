import { IsNumber, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  amount: number;  // Final amount in sengi

  @IsNumber()
  @IsOptional()
  originalAmount?: number;  // Original amount in sengi

  @IsNumber()
  @IsOptional()
  discountAmount?: number;  // Discount amount in sengi

  @IsString()
  currency: string;

  @IsString()
  uid: string;

  @IsString()
  planType: string;

  @IsString()
  @IsOptional()
  voucherCode?: string;
}