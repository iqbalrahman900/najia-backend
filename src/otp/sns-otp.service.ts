// src/otp/sns-otp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SNSClient, PublishCommand, PublishCommandInput } from '@aws-sdk/client-sns';
import { fromEnv } from '@aws-sdk/credential-providers';

@Injectable()
export class SnsOtpService {
  private readonly snsClient: SNSClient;
  private readonly logger = new Logger(SnsOtpService.name);
  private readonly otpTopicArn: string | undefined;

  constructor(private readonly configService: ConfigService) {
    // Create the SNS client with proper credential format
    this.snsClient = new SNSClient({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: fromEnv(),
    });
    
    // Get the OTP topic ARN from environment variables
    this.otpTopicArn = this.configService.get<string>('AWS_SNS_OTP_TOPIC_ARN');
  }

  /**
   * Send an OTP code via SMS
   */
  async sendOtpSms(phoneNumber: string, otpCode: string): Promise<string> {
    try {
      // Format the phone number if needed
      const formattedPhoneNumber = this.formatPhoneNumber(phoneNumber);
      
      // Create the SMS message
      const message = `Your NajiaApp verification code is: ${otpCode}. This code will expire in 10 minutes.`;
      
      // Create the publish parameters for direct SMS
      const params: PublishCommandInput = {
        PhoneNumber: formattedPhoneNumber,
        Message: message,
        MessageAttributes: {
          'AWS.SNS.SMS.SenderID': {
            DataType: 'String',
            StringValue: this.configService.get<string>('AWS_SNS_SENDER_ID') || 'NajiaApp',
          },
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional', // Use 'Transactional' for OTP
          },
        },
      };

      // Direct SMS sending without using a topic (more reliable for OTP)
      const command = new PublishCommand(params);
      const response = await this.snsClient.send(command);
      
      // Optionally log to topic for tracking
      if (this.otpTopicArn) {
        try {
          await this.snsClient.send(new PublishCommand({
            TopicArn: this.otpTopicArn,
            Message: `OTP sent to ${formattedPhoneNumber}: ${otpCode}`,
            MessageAttributes: {
              'PhoneNumber': {
                DataType: 'String',
                StringValue: formattedPhoneNumber,
              },
              'OTPType': {
                DataType: 'String',
                StringValue: 'SMS',
              },
            },
          }));
        } catch (topicError) {
          // Just log the error but don't fail the SMS delivery
          this.logger.warn(`Failed to log OTP to topic: ${topicError.message}`);
        }
      }
      
      // Return the MessageId or a placeholder if it's undefined
      return response.MessageId || `sms-sent-${Date.now()}`;
    } catch (error) {
      this.logger.error(`Error sending OTP SMS to ${phoneNumber}:`, error);
      throw new Error(`Failed to send OTP SMS: ${error.message}`);
    }
  }

  /**
   * Send OTP via email
   * Note: For production use, consider using SES instead of SNS for email
   */
  async sendOtpEmail(email: string, otpCode: string): Promise<string> {
    try {
      // Create the email message
      const message = `Your NajiaApp verification code is: ${otpCode}. This code will expire in 10 minutes.`;
      const subject = 'NajiaApp Verification Code';
      
      // For email, we always use the topic and need to subscribe the email first
      if (this.otpTopicArn) {
        // First, subscribe the email to the topic (if not already subscribed)
        // In a production environment, you would check if already subscribed
        
        // Send the message to the topic
        const command = new PublishCommand({
          TopicArn: this.otpTopicArn,
          Message: message,
          Subject: subject,
        });

        const response = await this.snsClient.send(command);
        return response.MessageId || `email-sent-${Date.now()}`;
      } else {
        this.logger.warn('No OTP topic ARN configured for email delivery');
        return 'email-not-sent';
      }
    } catch (error) {
      this.logger.error(`Error sending OTP email to ${email}:`, error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  /**
   * Format phone number to E.164 format
   * E.164 format is required by AWS SNS (+1XXXXXXXXXX)
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-numeric characters except leading +
    const hasPlus = phoneNumber.startsWith('+');
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add the + prefix if it was missing
    if (hasPlus) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }
}