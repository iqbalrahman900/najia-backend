// qada-puasa/qada-puasa.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QadaPuasa, QadaPuasaDocument } from './schemas/qada-puasa.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { CreateQadaPuasaDto } from './dto/create-qada-puasa.dto';
import { RecordQadaDto } from './dto/record-qada.dto';

@Injectable()
export class QadaPuasaService {
  constructor(
    @InjectModel(QadaPuasa.name) private qadaPuasaModel: Model<QadaPuasaDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private async getMongoUserId(firebaseUid: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ firebaseUid }).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user._id;
  }

  async create(firebaseUid: string, createDto: CreateQadaPuasaDto) {
    const userId = await this.getMongoUserId(firebaseUid);
    const totalDays = createDto.totalYears * 30;

    const existing = await this.qadaPuasaModel.findOne({ userId });
    if (existing) {
      return existing;
    }

    return this.qadaPuasaModel.create({
      userId,
      totalYears: createDto.totalYears,
      totalDays,
      completedDays: 0,
      history: []
    });
  }

  async updateProgress(firebaseUid: string, recordDto?: RecordQadaDto) {
    const userId = await this.getMongoUserId(firebaseUid);
    const result = await this.qadaPuasaModel.findOneAndUpdate(
      { userId },
      { 
        $inc: { completedDays: 1 },
        $push: { 
          history: {
            date: new Date(),
            notes: recordDto?.notes
          }
        }
      },
      { new: true }
    );
    
    if (!result) {
      throw new NotFoundException('Qada puasa tracker not found');
    }
    
    return result;
  }

  async getProgress(firebaseUid: string) {
    const userId = await this.getMongoUserId(firebaseUid);
    const result = await this.qadaPuasaModel.findOne({ userId });
    if (!result) return null;
    return result;
  }

  async getHistory(firebaseUid: string) {
    const userId = await this.getMongoUserId(firebaseUid);
    const result = await this.qadaPuasaModel.findOne({ userId });
    return result?.history || [];
  }
}