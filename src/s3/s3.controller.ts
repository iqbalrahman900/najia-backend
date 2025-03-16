// s3.controller.ts
import {
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
    Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/guards/auth.guard'; // Using your Firebase AuthGuard
import { S3Service } from './s3.service';
import { Public } from 'src/decorators/public.decorator';

@Controller('s3')
export class S3Controller {
    constructor(private readonly s3Service: S3Service) { }

    @UseGuards(AuthGuard)
    @Get('presigned-url')
    async getPresignedUrl(@Query('key') key: string, @Request() req) {
        if (!key) {
            throw new BadRequestException('Image key is required');
        }

        // You can use Firebase user ID for additional security or logging
        const userId = req.user.uid;

        const url = await this.s3Service.getPresignedUrl(key);
        return { success: true, url };
    }

    @UseGuards(AuthGuard)
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file, @Request() req) {
        if (!file) {
            throw new BadRequestException('File is required');
        }

        const userId = req.user.uid;
        // You can use userId in the file path for organization
        const key = `images/${userId}/${Date.now()}-${file.originalname.replace(/\s/g, '-')}`;

        const result = await this.s3Service.uploadFile(
            file.buffer,
            key,
            file.mimetype,
        );

        return {
            success: true,
            key: result.key,
            url: result.url,
        };
    }


    @Public()
    @Get('public-images')
    async getPublicImageUrl(@Query('key') key: string) {
        if (!key) {
            throw new BadRequestException('Image key is required');
        }

        const url = await this.s3Service.getPresignedUrl(key);
        return { success: true, url };
    }
}