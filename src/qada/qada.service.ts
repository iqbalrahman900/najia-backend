import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';  // Import Types from mongoose
import { QadaTracker } from './schemas/qada.schema';
import { User } from '../user/schemas/user.schema';
import { CreateQadaDto } from './dto/create-qada.dto';

@Injectable()
export class QadaService {
  constructor(
    @InjectModel(QadaTracker.name) private qadaModel: Model<QadaTracker>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  private async getMongoUserId(firebaseUid: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ firebaseUid }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user._id;
  }

  async create(firebaseUid: string, createQadaDto: CreateQadaDto) {
    const userId = await this.getMongoUserId(firebaseUid);
    const totalSalah = createQadaDto.totalYears * 365 * 5;
    const remainingPerPrayer = Math.floor(totalSalah / 5);
    const totalRemaining = totalSalah;

    const existingQada = await this.qadaModel.findOne({ userId });
    if (existingQada) {
      const totalCompleted = 
        existingQada.completedSubuh + 
        existingQada.completedZohor + 
        existingQada.completedAsar + 
        existingQada.completedMaghrib + 
        existingQada.completedIsya;
      return { ...existingQada.toObject(), totalRemaining: existingQada.totalSalah - totalCompleted };
    }

    const newQada = await this.qadaModel.create({
      userId,
      totalYears: createQadaDto.totalYears,
      totalSalah,
      remainingPerPrayer,
      completedSubuh: 0,
      completedZohor: 0,
      completedAsar: 0,
      completedMaghrib: 0,
      completedIsya: 0,
    });

    return { ...newQada.toObject(), totalRemaining };
  }

  async updateProgress(firebaseUid: string, prayerType: string) {
    const userId = await this.getMongoUserId(firebaseUid);
    const result = await this.qadaModel.findOneAndUpdate(
      { userId },
      { $inc: { [`completed${prayerType}`]: 1 } },
      { new: true }
    );
    
    if (!result) {
      throw new NotFoundException('Qada tracker not found');
    }
   
    const totalCompleted = 
      result.completedSubuh + 
      result.completedZohor + 
      result.completedAsar + 
      result.completedMaghrib + 
      result.completedIsya;
   
    const totalRemaining = result.totalSalah - totalCompleted;
   
    return { ...result.toObject(), totalRemaining };
  }

  async getProgress(firebaseUid: string) {
    const userId = await this.getMongoUserId(firebaseUid);
    const result = await this.qadaModel.findOne({ userId });
    if (!result) return null;

    const totalCompleted = 
      result.completedSubuh + 
      result.completedZohor + 
      result.completedAsar + 
      result.completedMaghrib + 
      result.completedIsya;

    return { ...result.toObject(), totalRemaining: result.totalSalah - totalCompleted };
  }

  async resetProgress(firebaseUid: string) {
    const userId = await this.getMongoUserId(firebaseUid);
    const result = await this.qadaModel.findOneAndUpdate(
      { userId },
      {
        completedSubuh: 0,
        completedZohor: 0,
        completedAsar: 0,
        completedMaghrib: 0,
        completedIsya: 0,
      },
      { new: true }
    );
   
    if (!result) {
      throw new NotFoundException('Qada tracker not found');
    }
   
    return { ...result.toObject(), totalRemaining: result.totalSalah };
  }
}