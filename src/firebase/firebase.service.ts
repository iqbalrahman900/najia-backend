import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.initializeFirebaseAdmin();
  }

  private initializeFirebaseAdmin() {
    // Check if Firebase Admin SDK is already initialized
    if (admin.apps.length > 0) {
      this.logger.log('Firebase Admin SDK already initialized');
      return;
    }

    try {
        // Get Firebase credentials from environment variables
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
      
        if (!projectId || !privateKey || !clientEmail) {
          this.logger.error('Missing Firebase credentials in environment variables');
          return;
        }
      
        // Now that we've verified privateKey is not undefined, we can safely replace
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      
        // Initialize the app
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: formattedPrivateKey,
            clientEmail,
          }),
        });
      
        this.logger.log('Firebase Admin SDK initialized successfully');
      } catch (error) {
        this.logger.error(`Firebase Admin SDK initialization failed: ${error.message}`);
      }
  }

  /**
   * Generate a custom Firebase token for authentication
   */
  async createCustomToken(uid: string, claims?: Record<string, any>): Promise<string> {
    try {
      return await admin.auth().createCustomToken(uid, claims);
    } catch (error) {
      this.logger.error(`Failed to create custom token: ${error.message}`);
      throw new Error('Failed to create authentication token');
    }
  }

  /**
   * Verify a Firebase ID token
   */
  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (error) {
      this.logger.error(`Failed to verify ID token: ${error.message}`);
      throw new Error('Invalid authentication token');
    }
  }
}