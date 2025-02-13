// src/guardian/services/guardian-logger.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GuardianLoggerService extends Logger {
  private formatLog(data: {
    action: string;
    category: string;
    status: string;
    userId: string;
    metadata?: any;
  }) {
    return {
      timestamp: new Date().toISOString(),
      ...data
    };
  }

  logActivity(data: {
    action: string;    // Specific action (e.g., 'CREATE_TASK', 'ADD_CHILD')
    category: string;  // Main category (e.g., 'TASK', 'CHILD', 'ROLE')
    status: string;    // Status of action (e.g., 'SUCCESS', 'FAILED', 'PENDING')
    userId: string;    // User performing the action
    metadata?: any;    // Additional data useful for analytics
  }) {
    const logEntry = this.formatLog(data);
    
    // Log to console for development
    console.log(`[Guardian Activity] ${JSON.stringify(logEntry, null, 2)}`);
    
    // Here you could also save to database for dashboard
    // this.saveToDatabase(logEntry);
  }
}