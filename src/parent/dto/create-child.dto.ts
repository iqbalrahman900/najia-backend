// parent/dto/create-child.dto.ts
import { IsString, IsNumber, Min } from 'class-validator';
export class CreateChildDto {
    @IsString()
    name: string;
   
    @IsNumber()
    @Min(1)
    age: number;
   
    @IsString()
    parentId: string;
   }
   