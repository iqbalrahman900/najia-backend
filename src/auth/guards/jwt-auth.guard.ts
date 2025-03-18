


import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FirebaseService } from '../../firebase/firebase.service';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  
  constructor(
    private firebaseService: FirebaseService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      IS_PUBLIC_KEY,
      [
        context.getHandler(),
        context.getClass(),
      ],
    );
    
    // If route is public, allow access
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
      // Use Firebase service to verify the ID token
      this.logger.debug(`Verifying token [start of token: ${token.substring(0, 20)}...]`);
      const decodedToken = await this.firebaseService.verifyIdToken(token);
      
      // Attach the user data to the request
      request.user = {
        userId: decodedToken.uid,
        phoneNumber: decodedToken.phoneNumber,
        firebaseUid: decodedToken.uid,
        ...decodedToken
      };
      
      this.logger.debug(`Token verified successfully for user: ${decodedToken.uid}`);
      return true;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}