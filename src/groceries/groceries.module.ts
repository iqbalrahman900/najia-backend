import { Module } from '@nestjs/common';
import { GroceriesService } from './groceries.service';
import { GroceriesController } from './groceries.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GroceryRequest, GroceryRequestSchema } from './schema/grocery-request.schema';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: GroceryRequest.name, schema: GroceryRequestSchema }]),
    UserModule
  ],
  controllers: [GroceriesController],
  providers: [GroceriesService],
})
export class GroceriesModule {}
