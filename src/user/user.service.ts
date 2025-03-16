// user/user.service.ts
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
    return this.userModel.findOne({ phoneNumber });
  }

  // Find user by email
  async findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  // Find by MongoDB ID (used by JWT strategy)
  async findById(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
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
    // During transition, we'll store firebaseUid in a separate field
    const user = await this.userModel.findOne({ firebaseUid });
    if (!user) {
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
  async createUser(phoneNumber: string, firebaseUid?: string) {
    // Check if user already exists
    const existingUser = await this.findByPhone(phoneNumber);
    if (existingUser) {
      // If user exists but doesn't have firebaseUid (and one is provided), update it
      if (firebaseUid && !existingUser.firebaseUid) {
        existingUser.firebaseUid = firebaseUid;
        await existingUser.save();
      }
      return existingUser;
    }

    // Create new user
    const user = new this.userModel({
      phoneNumber,
      firebaseUid, // Store firebaseUid if provided (for transition period)
      isProfileComplete: false,
      accountType: 'basic'
    });
    return user.save();
  }

  // Complete user profile
  async completeProfile(userId: string, profileData: CompleteProfileDto) {
    // Check if email is already in use by another user
    if (profileData.email) {
      const existingUserWithEmail = await this.userModel.findOne({
        email: profileData.email,
        _id: { $ne: userId }
      });

      if (existingUserWithEmail) {
        throw new ConflictException('Email already in use');
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      {
        ...profileData,
        dateOfBirth: new Date(profileData.dateOfBirth),
        isProfileComplete: true,
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  // Get user profile - works with either ID or Firebase UID
  async getUserProfile(userIdentifier: string) {
    // Try to find by MongoDB ID first
    try {
      const userById = await this.findById(userIdentifier);
      if (userById) return userById;
    } catch (error) {
      // If not a valid MongoDB ID, continue to try Firebase UID
    }
    
    // Try to find by Firebase UID
    try {
      return await this.findByFirebaseUid(userIdentifier);
    } catch (error) {
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
        { accountType },
        { new: true }
      );
    } catch (error) {
      // If not a valid MongoDB ID, try by Firebase UID
      updatedUser = await this.userModel.findOneAndUpdate(
        { firebaseUid: userIdentifier },
        { accountType },
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
    // Check if email is being updated and is already in use by another user
    if (profileData.email) {
      const existingUserWithEmail = await this.userModel.findOne({
        email: profileData.email,
      });
  
      if (existingUserWithEmail && 
          existingUserWithEmail._id.toString() !== userIdentifier &&
          existingUserWithEmail.firebaseUid !== userIdentifier) {
        throw new ConflictException('Email already in use');
      }
    }
  
    // Convert dateOfBirth to Date object if provided
    const updateData = {
      ...profileData,
      ...(profileData.dateOfBirth && { dateOfBirth: new Date(profileData.dateOfBirth) })
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
      // If not a valid MongoDB ID, try by Firebase UID
      updatedUser = await this.userModel.findOneAndUpdate(
        { firebaseUid: userIdentifier },
        { $set: updateData },
        { new: true }
      );
    }
  
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
  
    return updatedUser;
  }
}