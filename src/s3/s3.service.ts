import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3Service {
  private s3: S3;
  private bucket: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || 'najia';
    
    this.s3 = new S3({
      region: this.configService.get<string>('AWS_REGION') || 'ap-southeast-1',
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
    });
  }

  async getPresignedUrl(key: string): Promise<string> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      Expires: 3600, // 1 hour expiration
    };

    return this.s3.getSignedUrlPromise('getObject', params);
  }

  async uploadFile(
    file: Buffer,
    key: string,
    contentType: string,
  ): Promise<{ key: string; url: string }> {
    const params = {
      Bucket: this.bucket,
      Key: key,
      Body: file,
      ContentType: contentType,
    };

    const uploadResult = await this.s3.upload(params).promise();
    
    // Generate presigned URL for the uploaded file
    const url = await this.getPresignedUrl(key);
    
    return {
      key: uploadResult.Key,
      url,
    };
  }
}