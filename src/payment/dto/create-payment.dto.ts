// payment/dto/create-payment.dto.ts
import { IsNumber, IsString } from 'class-validator';

export class CreatePaymentDto {
 @IsNumber()
 amount: number;

 @IsString()
 currency: string;

 @IsString()
 uid: string;

 @IsString()
 planType: string;
}