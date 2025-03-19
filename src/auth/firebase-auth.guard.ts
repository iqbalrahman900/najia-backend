// src/auth/guards/firebase-auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseService } from '../firebase/firebase.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);
  
  constructor(
    private firebaseService: FirebaseService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()],
    );
    
    if (isPublic) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      this.logger.warn('Missing or invalid authorization header');
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      // Verify Firebase token
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      
      // Set user info on request
      request.user = {
        userId: decodedToken.uid,
        firebaseUid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number || decodedToken.phoneNumber,
        ...decodedToken
      };
      
      this.logger.debug(`Token verified for user: ${decodedToken.uid}`);
      return true;
    } catch (error) {
      this.logger.error(`Firebase token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}