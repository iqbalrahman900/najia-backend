// user/user.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { EditProfileDto } from './dto/edit-profile.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  // Add this new method for finding user by Firebase UID
  async findByFirebaseUid(firebaseUid: string) {
    const user = await this.userModel.findOne({ firebaseUid });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // Add a method to find by MongoDB ID
  async findById(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async createUser(firebaseUid: string, phoneNumber: string) {
    const existingUser = await this.userModel.findOne({ firebaseUid });
    if (existingUser) {
      return existingUser;
    }

    const user = new this.userModel({
      firebaseUid,
      phoneNumber,
      isProfileComplete: false,
      accountType: 'basic'
    });
    return user.save();
  }

  async completeProfile(firebaseUid: string, profileData: CompleteProfileDto) {
    // Check if email is already in use by another user
    const existingUserWithEmail = await this.userModel.findOne({
      email: profileData.email,
      firebaseUid: { $ne: firebaseUid }
    });

    if (existingUserWithEmail) {
      throw new ConflictException('Email already in use');
    }

    const updatedUser = await this.userModel.findOneAndUpdate(
      { firebaseUid },
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

  async getUserProfile(firebaseUid: string) {
    return this.findByFirebaseUid(firebaseUid); // Use the new method
  }

  async updateAccountType(firebaseUid: string, accountType: 'basic' | 'premium') {
    const updatedUser = await this.userModel.findOneAndUpdate(
      { firebaseUid },
      { accountType },
      { new: true }
    );

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async editProfile(firebaseUid: string, profileData: EditProfileDto) {
    // Check if email is being updated and is already in use by another user
    if (profileData.email) {
      const existingUserWithEmail = await this.userModel.findOne({
        email: profileData.email,
        firebaseUid: { $ne: firebaseUid }
      });
  
      if (existingUserWithEmail) {
        throw new ConflictException('Email already in use');
      }
    }
  
    // Convert dateOfBirth to Date object if provided
    const updateData = {
      ...profileData,
      ...(profileData.dateOfBirth && { dateOfBirth: new Date(profileData.dateOfBirth) })
    };
  
    const updatedUser = await this.userModel.findOneAndUpdate(
      { firebaseUid },
      { $set: updateData },
      { new: true }
    );
  
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
  
    return updatedUser;
  }

  // Add utility method for Firebase UID to MongoDB ID conversion
  async getMongoIdFromFirebaseUid(firebaseUid: string): Promise<string> {
    const user = await this.findByFirebaseUid(firebaseUid);
    return user._id.toString();
  }
}