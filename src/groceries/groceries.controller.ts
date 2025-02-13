import { Controller, Post, Get, Body, Param, Patch, NotFoundException } from '@nestjs/common';
import { GroceriesService } from './groceries.service'
import { CreateGroceryRequestDto } from './dto/create-grocery-request.dto';
import { User } from 'src/decorators/user.decorator';
import { UserService } from 'src/user/user.service';

@Controller('groceries')
export class GroceriesController {
  constructor(private readonly groceriesService: GroceriesService ,  private readonly userService: UserService) {}

  // @Post('request')
  // async create(@Body() createGroceryRequestDto: CreateGroceryRequestDto) {
  //   return this.groceriesService.createRequest(createGroceryRequestDto);
  // }

  private async getMongoUserId(firebaseUid: string): Promise<string> {
    try {
      const user = await this.userService.findByFirebaseUid(firebaseUid);
      return user._id.toString();
    } catch (error) {
      throw new NotFoundException('User not found');
    }
  }

  @Post('request')
async create(
  @Body() dto: CreateGroceryRequestDto,
) {
  try {
    console.log("Request DTO:", dto);
    
    // Use the existing utility method
    const mongoUserId = await this.userService.getMongoIdFromFirebaseUid(dto.userId);
    console.log("MongoDB User ID:", mongoUserId);
    
    return this.groceriesService.createRequest(mongoUserId, dto);
  } catch (error) {
    console.error("Error in create request:", error);
    throw error;
  }
}

  @Get('requests')
  async findAll() {
    return this.groceriesService.getAllRequests();
  }

  @Get('requests/:id')
  async findOne(@Param('id') id: string) {
    return this.groceriesService.getRequestById(id);
  }

  @Patch('requests/:id/approve')
  async approveRequest(@Param('id') id: string) {
    return this.groceriesService.approveRequest(id);
  }

  @Patch('requests/:id/reject')
  async rejectRequest(@Param('id') id: string) {
    return this.groceriesService.rejectRequest(id);
  }
}
