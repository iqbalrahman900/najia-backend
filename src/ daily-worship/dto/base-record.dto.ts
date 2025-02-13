// dto/base-record.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class BaseRecordDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}