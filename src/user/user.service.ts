import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { EditProfileDto } from './dto/edit-profile.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);  
  
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Find user by phone number (for OTP authentication)
  async findByPhone(phoneNumber: string) {
    this.logger.debug(`Looking for user with phone number: ${phoneNumber}`);
    return this.userModel.findOne({ phoneNumber });
  }

  // Find user by email
  async findByEmail(email: string) {
    this.logger.debug(`Looking for user with email: ${email}`);
    return this.userModel.findOne({ email });
  }

  // Find by MongoDB ID (used by JWT strategy)
  async findById(id: string) {
    try {
      this.logger.debug(`Looking for user by ID: ${id}`);
      const user = await this.userModel.findById(id);
      if (!user) {
        this.logger.debug(`No user found with ID: ${id}`);
        return null;
      }
      return user;
    } catch (error) {
      this.logger.error(`Error finding user by ID: ${error.message}`);
      return null;
    }
  }

  // COMPATIBILITY METHOD: Find by Firebase UID
  // This method helps with the transition from Firebase to JWT auth
  async findByFirebaseUid(firebaseUid: string) {
    this.logger.debug(`Looking for user by Firebase UID: ${firebaseUid}`);
    // During transition, we'll store firebaseUid in a separate field
    const user = await this.userModel.findOne({ firebaseUid });
    if (!user) {
      this.logger.debug(`No user found with Firebase UID: ${firebaseUid}`);
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // COMPATIBILITY METHOD: Convert Firebase UID to MongoDB ID
  // This helps with the transition period
  async getMongoIdFromFirebaseUid(firebaseUid: string): Promise<string> {
    const user = await this.findByFirebaseUid(firebaseUid);
    return user._id.toString();
  }

  // Create a new user from phone number (called after OTP verification)
  async createUser(phoneNumber: string, firebaseUid?: string, fcmToken?: string) {
    this.logger.log(`Creating/finding user with phone: ${phoneNumber}, Firebase UID: ${firebaseUid || 'none'}`);
    
    try {
      // Check if user already exists
      const existingUser = await this.findByPhone(phoneNumber);
      
      if (existingUser) {
        this.logger.log(`User already exists with phone ${phoneNumber}, ID: ${existingUser._id}`);
        
        // Keep track if we need to update the user
        let needsUpdate = false;
        
        // If user exists but doesn't have firebaseUid (and one is provided), update it
        if (firebaseUid && !existingUser.firebaseUid) {
          this.logger.log(`Updating existing user with Firebase UID: ${firebaseUid}`);
          existingUser.firebaseUid = firebaseUid;
          needsUpdate = true;
        }
        
        // If fcmToken is provided, update it
        if (fcmToken) {
          this.logger.log(`Updating existing user with FCM token`);
          existingUser.fcmToken = fcmToken;
          needsUpdate = true;
        }
        
        // Save if any updates were made
        if (needsUpdate) {
          await existingUser.save();
          this.logger.log('User updated successfully');
        }
        
        return existingUser;
      }

      // Create new user
      this.logger.log(`No existing user found, creating new user with phone: ${phoneNumber}`);
      const user = new this.userModel({
        phoneNumber,
        firebaseUid,  // Store firebaseUid if provided
        fcmToken,     // Store fcmToken if provided
        isProfileComplete: false,
        accountType: 'basic',
        createdAt: new Date()
      });
      
      const savedUser = await user.save();
      this.logger.log(`New user created successfully, ID: ${savedUser._id}`);
      return savedUser;
    } catch (error) {
      this.logger.error(`Error in createUser: ${error.message}`);
      throw error;
    }
  }

  // Complete user profile
  async completeProfile(userId: string, profileData: CompleteProfileDto) {
    this.logger.log(`Completing profile for user ${userId}`);
    
    // Check if email is already in use by another user
    if (profileData.email) {
      this.logger.debug(`Checking if email ${profileData.email} is already in use`);
      const existingUserWithEmail = await this.userModel.findOne({
        email: profileData.email,
        _id: { $ne: userId }
      });

      if (existingUserWithEmail) {
        this.logger.warn(`Email ${profileData.email} is already in use by another user`);
        throw new ConflictException('Email already in use');
      }
    }

    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        {
          ...profileData,
          dateOfBirth: new Date(profileData.dateOfBirth),
          isProfileComplete: true,
          updatedAt: new Date()
        },
        { new: true },
      );

      if (!updatedUser) {
        this.logger.warn(`User not found with ID ${userId} when completing profile`);
        throw new NotFoundException('User not found');
      }

      this.logger.log(`Profile completed successfully for user ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Error completing profile for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  // Get user profile - works with either ID or Firebase UID
  async getUserProfile(userIdentifier: string) {
    this.logger.log(`Getting profile for user with identifier: ${userIdentifier}`);
    
    // Try to find by MongoDB ID first
    try {
      const userById = await this.findById(userIdentifier);
      if (userById) {
        this.logger.debug(`Found user by MongoDB ID: ${userIdentifier}`);
        return userById;
      }
    } catch (error) {
      this.logger.debug(`Error finding by MongoDB ID, will try Firebase UID next: ${error.message}`);
      // If not a valid MongoDB ID, continue to try Firebase UID
    }
    
    // Try to find by Firebase UID
    try {
      const userByFirebaseUid = await this.findByFirebaseUid(userIdentifier);
      this.logger.debug(`Found user by Firebase UID: ${userIdentifier}`);
      return userByFirebaseUid;
    } catch (error) {
      this.logger.warn(`User not found with identifier: ${userIdentifier}`);
      throw new NotFoundException('User not found');
    }
  }

  // Update account type - works with either ID or Firebase UID
  async updateAccountType(userIdentifier: string, accountType: 'basic' | 'premium') {
    this.logger.log(`Updating account type to ${accountType} for user ${userIdentifier}`);

    let updatedUser;
    
    // Try to update by MongoDB ID first
    try {
      updatedUser = await this.userModel.findByIdAndUpdate(
        userIdentifier,
        { 
          accountType,
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      this.logger.debug(`Error updating by MongoDB ID, trying Firebase UID: ${error.message}`);
      // If not a valid MongoDB ID, try by Firebase UID
      updatedUser = await this.userModel.findOneAndUpdate(
        { firebaseUid: userIdentifier },
        { 
          accountType,
          updatedAt: new Date()
        },
        { new: true }
      );
    }

    if (!updatedUser) {
      this.logger.error(`User not found with identifier: ${userIdentifier}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Successfully updated account type for user ${userIdentifier}`);
    return updatedUser;
  }

  // Edit profile - works with either ID or Firebase UID
  async editProfile(userIdentifier: string, profileData: EditProfileDto) {
    this.logger.log(`Editing profile for user ${userIdentifier}`);
    
    // Check if email is being updated and is already in use by another user
    if (profileData.email) {
      this.logger.debug(`Checking if email ${profileData.email} is already in use`);
      const existingUserWithEmail = await this.userModel.findOne({
        email: profileData.email,
      });
  
      if (existingUserWithEmail && 
          existingUserWithEmail._id.toString() !== userIdentifier &&
          existingUserWithEmail.firebaseUid !== userIdentifier) {
        this.logger.warn(`Email ${profileData.email} is already in use by another user`);
        throw new ConflictException('Email already in use');
      }
    }
  
    // Convert dateOfBirth to Date object if provided
    const updateData = {
      ...profileData,
      ...(profileData.dateOfBirth && { dateOfBirth: new Date(profileData.dateOfBirth) }),
      updatedAt: new Date()
    };
  
    let updatedUser;
    
    // Try to update by MongoDB ID first
    try {
      updatedUser = await this.userModel.findByIdAndUpdate(
        userIdentifier,
        { $set: updateData },
        { new: true }
      );
    } catch (error) {
      this.logger.debug(`Error updating by MongoDB ID, trying Firebase UID: ${error.message}`);
      // If not a valid MongoDB ID, try by Firebase UID
      updatedUser = await this.userModel.findOneAndUpdate(
        { firebaseUid: userIdentifier },
        { $set: updateData },
        { new: true }
      );
    }
  
    if (!updatedUser) {
      this.logger.warn(`User not found with identifier: ${userIdentifier}`);
      throw new NotFoundException('User not found');
    }
  
    this.logger.log(`Profile updated successfully for user ${userIdentifier}`);
    return updatedUser;
  }
  
  // Update FCM token - works with either ID or Firebase UID
  async updateFcmToken(userIdentifier: string, fcmToken: string) {
    this.logger.log(`Updating FCM token for user ${userIdentifier}`);
    
    let updatedUser;
    
    // Try to update by MongoDB ID first
    try {
      updatedUser = await this.userModel.findByIdAndUpdate(
        userIdentifier,
        { 
          fcmToken,
          updatedAt: new Date()
        },
        { new: true }
      );
    } catch (error) {
      this.logger.debug(`Error updating by MongoDB ID, trying Firebase UID: ${error.message}`);
      // If not a valid MongoDB ID, try by Firebase UID
      updatedUser = await this.userModel.findOneAndUpdate(
        { firebaseUid: userIdentifier },
        { 
          fcmToken,
          updatedAt: new Date()
        },
        { new: true }
      );
    }

    if (!updatedUser) {
      this.logger.error(`User not found with identifier: ${userIdentifier}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`Successfully updated FCM token for user ${userIdentifier}`);
    return { success: true };
  }
}