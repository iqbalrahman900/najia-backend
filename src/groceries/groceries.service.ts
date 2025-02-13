import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GroceryRequest, GroceryRequestDocument } from './schema/grocery-request.schema';
import { CreateGroceryRequestDto } from './dto/create-grocery-request.dto';

@Injectable()
export class GroceriesService {
  constructor(@InjectModel(GroceryRequest.name) private groceryRequestModel: Model<GroceryRequestDocument>) {}

  async createRequest(userId: string, dto: CreateGroceryRequestDto): Promise<GroceryRequest> {
    const request = new this.groceryRequestModel({
      ...dto,
      userId, // Place userId after the spread to ensure it's not overwritten
      status: dto.amountRequested <= 200 ? 'approved' : 'pending'
    });
  
    return request.save();
  }

  async getAllRequests(): Promise<GroceryRequest[]> {
    return this.groceryRequestModel.find().exec();
  }

  async getRequestById(id: string): Promise<GroceryRequest> {
    const request = await this.groceryRequestModel.findById(id);
    if (!request) {
      throw new NotFoundException('Grocery request not found');
    }
    return request;
  }

  async approveRequest(id: string): Promise<GroceryRequest> {
    return this.updateRequestStatus(id, 'approved');
  }

  async rejectRequest(id: string): Promise<GroceryRequest> {
    return this.updateRequestStatus(id, 'rejected');
  }

  private async updateRequestStatus(id: string, status: string): Promise<GroceryRequest> {
    const request = await this.groceryRequestModel.findByIdAndUpdate(id, { status }, { new: true });
    if (!request) {
      throw new NotFoundException('Grocery request not found');
    }
    return request;
  }
}
