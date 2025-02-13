// payment/payment.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Payment } from './schemas/payment.schema';
import { UserService } from '../user/user.service';
import { STRIPE_CLIENT } from './stripe.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
 constructor(
   @InjectModel(Payment.name) private paymentModel: Model<Payment>,
   @Inject(STRIPE_CLIENT) private stripe: Stripe,
   private userService: UserService,
 ) {}

 async createPaymentIntent(data: CreatePaymentDto) {
   const amount = Math.round(data.amount);
   
   const paymentIntent = await this.stripe.paymentIntents.create({
     amount,
     currency: data.currency,
     metadata: {
       uid: data.uid,
       planType: data.planType,
     },
   });

   await this.paymentModel.create({
     uid: data.uid,
     planType: data.planType,
     amount: amount / 100,
     status: 'pending',
     stripePaymentIntentId: paymentIntent.id,
   });

   return {
     clientSecret: paymentIntent.client_secret,
     id: paymentIntent.id,
   };
 }

 async confirmPayment(data: { paymentIntentId: string; uid: string }) {
   const paymentIntent = await this.stripe.paymentIntents.retrieve(
     data.paymentIntentId,
   );

   if (paymentIntent.status === 'succeeded') {
     await this.paymentModel.findOneAndUpdate(
       { stripePaymentIntentId: data.paymentIntentId },
       { status: 'completed' },
     );

     await this.userService.updateAccountType(data.uid, 'premium');
     return { status: 'success' };
   }

   return { status: 'failed' };
 }

 async validatePromoCode(code: string): Promise<boolean> {
   const validCodes = ['RAMADAN2024', 'LAUNCH50'];
   return validCodes.includes(code);
 }
}