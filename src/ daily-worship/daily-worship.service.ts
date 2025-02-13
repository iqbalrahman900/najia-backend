// daily-worship.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage } from 'mongoose';
import { WorshipRecord, WorshipRecordDocument } from './schemas/worship-record.schema';
import { User, UserDocument } from '../user/schemas/user.schema';
import { RecordSelawatDto } from './dto/record-selawat.dto';
import { RecordIstigfarDto } from './dto/record-istigfar.dto';
import { RecordQuranDto } from './dto/record-quran.dto';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { DailyProgressDetail, MonthlyProgress, WeeklyProgress } from './interfaces/daily-progress.interface';

dayjs.extend(utc);
dayjs.extend(timezone);

@Injectable()
export class DailyWorshipService {
  constructor(
    @InjectModel(WorshipRecord.name)
    private worshipRecordModel: Model<WorshipRecordDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>
) {}

  private async createCountRecord(
    userId: string,
    type: 'SELAWAT' | 'ISTIGFAR',
    count: number,
    notes?: string,
  ) {
    const today = dayjs().tz('Asia/Kuala_Lumpur').startOf('day').utc(true).toDate();
    
    const existingRecord = await this.worshipRecordModel.findOne({
      userId,
      type,
      recordDate: today,
    });

    if (existingRecord) {
      existingRecord.count += count;
      if (notes) {
        existingRecord.notes = existingRecord.notes 
          ? `${existingRecord.notes}\n${notes}`
          : notes;
      }
      return existingRecord.save();
    }

    const newRecord = new this.worshipRecordModel({
      userId,
      type,
      count,
      notes,
      recordDate: today,
    });
    return newRecord.save();
  }

  async recordSelawat(userId: string, dto: RecordSelawatDto) {
    return this.createCountRecord(userId, 'SELAWAT', dto.count, dto.notes);
  }

  async recordIstigfar(userId: string, dto: RecordIstigfarDto) {
    return this.createCountRecord(userId, 'ISTIGFAR', dto.count, dto.notes);
  }

  async recordQuran(userId: string, dto: RecordQuranDto) {
    const today = dayjs().tz('Asia/Kuala_Lumpur').startOf('day').utc(true).toDate();
    
    const existingRecord = await this.worshipRecordModel.findOne({
      userId,
      type: 'QURAN',
      recordDate: today,
    });

    if (existingRecord) {
      existingRecord.minutes = (existingRecord.minutes || 0) + dto.minutes;
      if (dto.notes) {
        existingRecord.notes = existingRecord.notes 
          ? `${existingRecord.notes}\n${dto.notes}`
          : dto.notes;
      }
      return existingRecord.save();
    }

    const newRecord = new this.worshipRecordModel({
      userId,
      type: 'QURAN',
      count: 1,
      minutes: dto.minutes,
      notes: dto.notes,
      recordDate: today,
    });
    return newRecord.save();
  }

  async getDailyProgress(userId: string) {
    const today = dayjs().tz('Asia/Kuala_Lumpur').startOf('day').utc(true).toDate();
    
    const records = await this.worshipRecordModel.find({
      userId,
      recordDate: today,
    });

    return {
      date: today,
      selawat: records.find(r => r.type === 'SELAWAT')?.count || 0,
      istigfar: records.find(r => r.type === 'ISTIGFAR')?.count || 0,
      quran: {
        minutes: records.find(r => r.type === 'QURAN')?.minutes || 0,
      },
    };
  }

  async getWeeklyProgress(userId: string): Promise<WeeklyProgress> {
    const now = dayjs().tz('Asia/Kuala_Lumpur');
    const startOfWeek = now.startOf('week').utc(true).toDate();
    const endOfWeek = now.endOf('week').utc(true).toDate();

    const records = await this.worshipRecordModel.find({
      userId,
      recordDate: {
        $gte: startOfWeek,
        $lte: endOfWeek
      }
    });

    const dailyProgress: DailyProgressDetail[] = [];
    for (let d = dayjs(startOfWeek).tz('Asia/Kuala_Lumpur'); 
         d.isBefore(dayjs(endOfWeek).tz('Asia/Kuala_Lumpur')); 
         d = d.add(1, 'day')) {
      const date = d.utc(true).toDate();
      const dayRecords = records.filter(r => 
        dayjs(r.recordDate).tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD') === 
        d.format('YYYY-MM-DD')
      );

      dailyProgress.push({
        date,
        selawat: dayRecords.find(r => r.type === 'SELAWAT')?.count || 0,
        istigfar: dayRecords.find(r => r.type === 'ISTIGFAR')?.count || 0,
        quran: {
          minutes: dayRecords.find(r => r.type === 'QURAN')?.minutes || 0,
        },
      });
    }

    return {
      dailyProgress,
      totals: {
        selawat: records.filter(r => r.type === 'SELAWAT')
          .reduce((sum, r) => sum + r.count, 0),
        istigfar: records.filter(r => r.type === 'ISTIGFAR')
          .reduce((sum, r) => sum + r.count, 0),
        quran: {
          minutes: records.filter(r => r.type === 'QURAN')
            .reduce((sum, r) => sum + (r.minutes || 0), 0),
        },
      },
    };
  }

  // async getMonthlyProgress(userId: string): Promise<WeeklyProgress> {
  //   const now = dayjs().tz('Asia/Kuala_Lumpur');
  //   const startOfMonth = now.startOf('month').utc(true).toDate();
  //   const endOfMonth = now.endOf('month').utc(true).toDate();

  //   const records = await this.worshipRecordModel.find({
  //     userId,
  //     recordDate: {
  //       $gte: startOfMonth,
  //       $lte: endOfMonth
  //     }
  //   });

  //   const dailyProgress: DailyProgressDetail[] = [];
  //   for (let d = dayjs(startOfMonth).tz('Asia/Kuala_Lumpur'); 
  //        d.isBefore(dayjs(endOfMonth).tz('Asia/Kuala_Lumpur')); 
  //        d = d.add(1, 'day')) {
  //     const date = d.utc(true).toDate();
  //     const dayRecords = records.filter(r => 
  //       dayjs(r.recordDate).tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD') === 
  //       d.format('YYYY-MM-DD')
  //     );

  //     dailyProgress.push({
  //       date,
  //       selawat: dayRecords.find(r => r.type === 'SELAWAT')?.count || 0,
  //       istigfar: dayRecords.find(r => r.type === 'ISTIGFAR')?.count || 0,
  //       quran: {
  //         minutes: dayRecords.find(r => r.type === 'QURAN')?.minutes || 0,
  //       },
  //     });
  //   }

  //   return {
  //     dailyProgress,
  //     totals: {
  //       selawat: records.filter(r => r.type === 'SELAWAT')
  //         .reduce((sum, r) => sum + r.count, 0),
  //       istigfar: records.filter(r => r.type === 'ISTIGFAR')
  //         .reduce((sum, r) => sum + r.count, 0),
  //       quran: {
  //         minutes: records.filter(r => r.type === 'QURAN')
  //           .reduce((sum, r) => sum + (r.minutes || 0), 0),
  //       },
  //     },
  //   };
  // }

  async getLeaderboard(startDate: Date, endDate: Date) {
    console.log('Date Range:', { startDate, endDate });

    const pipeline: PipelineStage[] = [
      {
        $match: {
          recordDate: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$userId',
          selawat: {
            $sum: {
              $cond: [{ $eq: ['$type', 'SELAWAT'] }, '$count', 0]
            }
          },
          istigfar: {
            $sum: {
              $cond: [{ $eq: ['$type', 'ISTIGFAR'] }, '$count', 0]
            }
          },
          quranMinutes: {
            $sum: {
              $cond: [{ $eq: ['$type', 'QURAN'] }, { $ifNull: ['$minutes', 0] }, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', { $toObjectId: '$$userId' }] }
              }
            }
          ],
          as: 'userDetails'
        }
      },
      {
        $unwind: {
          path: '$userDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          selawat: 1,
          istigfar: 1,
          quranMinutes: 1,
          name: { $ifNull: ['$userDetails.name', 'Unknown User'] },
          email: '$userDetails.email',
          phoneNumber: '$userDetails.phoneNumber',
          accountType: '$userDetails.accountType'
        }
      },
      {
        $sort: {
          quranMinutes: -1,  // First priority is now Quran minutes
          selawat: -1,       // Second priority
          istigfar: -1       // Third priority
        }
      },
      {
        $limit: 20
      }
    ];

    const results = await this.worshipRecordModel.aggregate(pipeline);
    console.log('Leaderboard results:', results.length);
    return results;
}
  async getWeeklyLeaderboard() {
    const now = dayjs().tz('Asia/Kuala_Lumpur');
    const startOfWeek = now.startOf('week').utc(true).toDate();
    const endOfWeek = now.endOf('week').utc(true).toDate();
    
    return this.getLeaderboard(startOfWeek, endOfWeek);
  }

 async getMonthlyProgress(userId: string, month?: number, year?: number): Promise<MonthlyProgress> {
    // If month/year not provided, use current month
    const now = dayjs().tz('Asia/Kuala_Lumpur');
    const targetDate = month !== undefined && year !== undefined 
      ? dayjs().tz('Asia/Kuala_Lumpur').year(year).month(month)
      : now;
  
    const startOfMonth = targetDate.startOf('month').utc(true).toDate();
    const endOfMonth = targetDate.endOf('month').utc(true).toDate();
  
    const records = await this.worshipRecordModel.find({
      userId,
      recordDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });
  
    const dailyProgress: DailyProgressDetail[] = [];
    for (let d = dayjs(startOfMonth).tz('Asia/Kuala_Lumpur'); 
         d.isBefore(dayjs(endOfMonth).tz('Asia/Kuala_Lumpur')); 
         d = d.add(1, 'day')) {
      const date = d.utc(true).toDate();
      const dayRecords = records.filter(r => 
        dayjs(r.recordDate).tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD') === 
        d.format('YYYY-MM-DD')
      );
  
      dailyProgress.push({
        date,
        selawat: dayRecords.find(r => r.type === 'SELAWAT')?.count || 0,
        istigfar: dayRecords.find(r => r.type === 'ISTIGFAR')?.count || 0,
        quran: {
          minutes: dayRecords.find(r => r.type === 'QURAN')?.minutes || 0,
        },
      });
    }
  
    return {
      dailyProgress,
      totals: {
        selawat: records.filter(r => r.type === 'SELAWAT')
          .reduce((sum, r) => sum + r.count, 0),
        istigfar: records.filter(r => r.type === 'ISTIGFAR')
          .reduce((sum, r) => sum + r.count, 0),
        quran: {
          minutes: records.filter(r => r.type === 'QURAN')
            .reduce((sum, r) => sum + (r.minutes || 0), 0),
        },
      },
      metadata: {
        month: targetDate.month(),
        year: targetDate.year(),
        startDate: startOfMonth,
        endDate: endOfMonth
      }
    };
  }

  async getMonthlyLeaderboard() {
    const now = dayjs().tz('Asia/Kuala_Lumpur');
    const startOfMonth = now.startOf('month').utc(true).toDate();
    const endOfMonth = now.endOf('month').utc(true).toDate();
    
    return this.getLeaderboard(startOfMonth, endOfMonth);
  }

  async getUserRank(userId: string, type: 'weekly' | 'monthly') {
    const now = dayjs().tz('Asia/Kuala_Lumpur');
    const [startDate, endDate] = type === 'weekly'
      ? [now.startOf('week').utc(true).toDate(), now.endOf('week').utc(true).toDate()]
      : [now.startOf('month').utc(true).toDate(), now.endOf('month').utc(true).toDate()];

    const leaderboard = await this.getLeaderboard(startDate, endDate);
    const userRank = leaderboard.findIndex(record => record._id === userId) + 1;

    return {
      rank: userRank || leaderboard.length + 1,
      totalParticipants: leaderboard.length,
      stats: leaderboard.find(record => record._id === userId) || {
        selawat: 0,
        istigfar: 0,
        quranMinutes: 0
      }
    };
  }
}