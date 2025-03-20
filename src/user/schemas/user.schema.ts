// user/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  phoneNumber: string;

  // Keep this for backward compatibility during transition
  @Prop({ sparse: true })
  firebaseUid: string;

  @Prop({ sparse: true })
  email: string;

  @Prop()
  name: string;

  @Prop()
  dateOfBirth: Date;

  @Prop({ enum: ['male', 'female', 'other'] })
  gender: string;

  @Prop({ default: false })
  isProfileComplete: boolean;

  @Prop({ default: 'basic', enum: ['basic', 'premium'] })
  accountType: string;

  @Prop({ sparse: true })
  fcmToken: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ phoneNumber: 1 }, { unique: true });
UserSchema.index({ email: 1 }, { sparse: true });
UserSchema.index({ firebaseUid: 1 }, { sparse: true });