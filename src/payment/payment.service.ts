// payment/payment.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Payment } from './schemas/payment.schema';
import { Subscription } from './schemas/subscription.schema';
import { UserService } from '../user/user.service';
import { STRIPE_CLIENT } from './stripe.provider';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<Payment>,
    @InjectModel(Subscription.name) private subscriptionModel: Model<Subscription>,
    @Inject(STRIPE_CLIENT) private stripe: Stripe,
    private userService: UserService,
  ) {}

  async handleSuccessfulPayment(
    paymentIntentId: string,
    uid: string,  // This is the firebaseUid
    planType: string,
  ) {
    this.logger.log(`Starting handleSuccessfulPayment for paymentIntentId: ${paymentIntentId}`);
  
    try {
      // First, verify the payment exists
      const existingPayment = await this.paymentModel.findOne({
        stripePaymentIntentId: paymentIntentId
      });
  
      if (!existingPayment) {
        this.logger.error(`Payment not found for paymentIntentId: ${paymentIntentId}`);
        throw new Error('Payment record not found');
      }
  
      // Update payment status
      const updatedPayment = await this.paymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { 
          $set: {
            status: 'completed',
            date: new Date()
          }
        },
        { new: true }
      );
  
      if (!updatedPayment) {
        throw new Error('Failed to update payment status');
      }
  
      // Update user's account type using firebaseUid
      await this.userService.updateAccountType(uid, 'premium');
      
      // Create or update subscription
      await this.createOrUpdateSubscription(uid, planType);
  
      return { 
        status: 'success',
        paymentId: updatedPayment._id
      };
    } catch (error) {
      this.logger.error('Error in handleSuccessfulPayment:', error);
      throw error;
    }
  }

  private async createOrUpdateSubscription(uid: string, planType: string) {
    try {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + (planType === 'yearly' ? 12 : 1));

      // Check for existing active subscription
      const existingSubscription = await this.subscriptionModel.findOne({
        uid,
        status: 'active'
      });

      if (existingSubscription) {
        this.logger.log(`Updating existing subscription for user: ${uid}`);
        await this.subscriptionModel.findByIdAndUpdate(
          existingSubscription._id,
          {
            planType,
            startDate: new Date(),
            endDate,
            status: 'active'
          },
          { new: true }
        );
      } else {
        this.logger.log(`Creating new subscription for user: ${uid}`);
        await this.subscriptionModel.create({
          uid,
          planType,
          startDate: new Date(),
          endDate,
          status: 'active'
        });
      }
    } catch (error) {
      this.logger.error('Error in createOrUpdateSubscription:', error);
      throw error;
    }
  }

  // Add this method to manually check and fix payment status
  async verifyAndFixPaymentStatus(paymentIntentId: string) {
    try {
      // Get payment status from Stripe
      const stripePayment = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (stripePayment.status === 'succeeded') {
        // Force update the local payment status
        const updatedPayment = await this.paymentModel.findOneAndUpdate(
          { stripePaymentIntentId: paymentIntentId },
          { 
            $set: {
              status: 'completed',
              date: new Date()
            }
          },
          { new: true }
        );

        return {
          success: true,
          stripeStatus: stripePayment.status,
          localStatus: updatedPayment?.status,
          paymentId: updatedPayment?._id
        };
      }

      return {
        success: false,
        stripeStatus: stripePayment.status,
        message: 'Payment not succeeded in Stripe'
      };
    } catch (error) {
      this.logger.error('Error in verifyAndFixPaymentStatus:', error);
      throw error;
    }
  }

  async handleFailedPayment(paymentIntentId: string) {
    this.logger.log(`Starting handleFailedPayment for paymentIntentId: ${paymentIntentId}`);

    try {
      // First, verify the payment exists
      const existingPayment = await this.paymentModel.findOne({
        stripePaymentIntentId: paymentIntentId
      });

      if (!existingPayment) {
        this.logger.error(`Payment not found for paymentIntentId: ${paymentIntentId}`);
        throw new Error('Payment record not found');
      }

      this.logger.log(`Found existing payment with ID: ${existingPayment._id}`);

      // Update payment status with explicit query and return options
      const updatedPayment = await this.paymentModel.findOneAndUpdate(
        { stripePaymentIntentId: paymentIntentId },
        { 
          $set: {
            status: 'failed',
            date: new Date()
          }
        },
        { 
          new: true,
          runValidators: true
        }
      );

      if (!updatedPayment) {
        this.logger.error(`Failed to update payment status for paymentIntentId: ${paymentIntentId}`);
        throw new Error('Failed to update payment status');
      }

      this.logger.log(`Successfully updated payment status to failed for ID: ${updatedPayment._id}`);

      // Verify the status was actually updated
      const verifiedPayment = await this.paymentModel.findOne({
        stripePaymentIntentId: paymentIntentId
      });

      if (verifiedPayment?.status !== 'failed') {
        this.logger.error(`Payment status verification failed. Current status: ${verifiedPayment?.status}`);
        throw new Error('Payment status verification failed');
      }

      this.logger.log(`Payment status verified as failed for ID: ${paymentIntentId}`);

      return { 
        status: 'failed',
        paymentId: updatedPayment._id,
        verifiedStatus: verifiedPayment.status
      };
    } catch (error) {
      this.logger.error('Error in handleFailedPayment:', error);
      // Re-throw the error after logging
      throw error;
    }
  }

  async createPaymentIntent(data: CreatePaymentDto) {
    try {
      this.logger.log(`=== PAYMENT INTENT CREATION START ===`);
      this.logger.log(`Payment data:`, {
        finalAmount: data.amount,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
        planType: data.planType,
        voucherCode: data.voucherCode,
      });
  
      const finalAmount = Math.round(data.amount);
      this.logger.log(`Final amount in sengi: ${finalAmount}`);
  
      // Check minimum amount (RM 2.00 = 200 sengi)
      if (finalAmount < 200) {
        throw new Error('Amount must be at least RM 2.00');
      }
  
      // Prepare metadata
      const metadata: Record<string, string> = {
        uid: data.uid,
        planType: data.planType,
      };
  
      // Add optional fields to metadata if present
      if (data.voucherCode) {
        metadata.voucherCode = data.voucherCode;
      }
      if (data.originalAmount) {
        metadata.originalAmount = data.originalAmount.toString();
      }
      if (data.discountAmount) {
        metadata.discountAmount = data.discountAmount.toString();
      }
  
      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: finalAmount,
        currency: data.currency.toLowerCase(),
        metadata,
      });
  
      this.logger.log(`Payment intent created with ID: ${paymentIntent.id}`);
  
      // Create payment record
      await this.paymentModel.create({
        uid: data.uid,
        planType: data.planType,
        amount: finalAmount,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        voucherCode: data.voucherCode,
        date: new Date(),
      });
  
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: finalAmount,
        originalAmount: data.originalAmount,
        discountAmount: data.discountAmount,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw error;
    }
  }
  
  async confirmPayment(data: { paymentIntentId: string; uid: string }) {
    this.logger.log(`Confirming payment for intent: ${data.paymentIntentId}`);
  
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        data.paymentIntentId
      );
  
      if (paymentIntent.metadata.uid !== data.uid) {
        this.logger.error(`Unauthorized payment confirmation attempt for user: ${data.uid}`);
        throw new Error('Unauthorized payment confirmation attempt');
      }
  
      if (paymentIntent.status === 'succeeded') {
        await this.handleSuccessfulPayment(
          data.paymentIntentId,
          data.uid,
          paymentIntent.metadata.planType
        );
        return { status: 'success', paymentIntent };
      } else {
        await this.handleFailedPayment(data.paymentIntentId);
        throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
      }
    } catch (error) {
      this.logger.error('Error confirming payment:', error);
      throw error;
    }
  }
  
  async validatePromoCode(code: string) {
    this.logger.log(`Validating promo code: ${code}`);
  
    try {
      const promoCode = await this.stripe.promotionCodes.list({
        code,
        active: true,
      });
  
      if (promoCode.data.length === 0) {
        this.logger.log(`Invalid promo code: ${code}`);
        return { valid: false, message: 'Invalid promo code' };
      }
  
      const promotion = promoCode.data[0];
      
      this.logger.log(`Valid promo code found: ${code}`);
      return {
        valid: true,
        discount: promotion.coupon.percent_off || promotion.coupon.amount_off,
        discountType: promotion.coupon.percent_off ? 'percentage' : 'fixed',
      };
    } catch (error) {
      this.logger.error('Error validating promo code:', error);
      throw error;
    }
  }


  async validateVoucherCode(code: string): Promise<{
    valid: boolean;
    discount?: number;
    discountType?: 'percentage' | 'fixed';
    message?: string;
  }> {
    this.logger.log(`Validating voucher: ${code}`);
  
    try {
      const promoCode = await this.stripe.promotionCodes.list({
        code,
        active: true,
      });
  
      if (promoCode.data.length === 0) {
        return { valid: false, message: 'Invalid voucher code' };
      }
  
      const promotion = promoCode.data[0];
      
      if (!promotion.active) {
        return { valid: false, message: 'Voucher has expired' };
      }
  
      if (promotion.coupon.percent_off) {
        return {
          valid: true,
          discount: promotion.coupon.percent_off,
          discountType: 'percentage',
        };
      } else if (promotion.coupon.amount_off) {
        // Convert Stripe amount_off (already in sengi) to our format
        return {
          valid: true,
          discount: promotion.coupon.amount_off,
          discountType: 'fixed',
        };
      }
  
      return { valid: false, message: 'Invalid voucher type' };
    } catch (error) {
      this.logger.error('Error validating voucher:', error);
      throw error;
    }
  }
  
  async calculateDiscountedAmount(amount: number, voucherCode: string): Promise<{
    finalAmount: number;
    discountAmount: number;
    voucherDetails?: {
      code: string;
      discountType: 'percentage' | 'fixed';
      discountValue: number;
    };
  }> {
    this.logger.log('=== DISCOUNT CALCULATION START ===');
    this.logger.log(`Original amount (sengi): ${amount}`);
    this.logger.log(`Voucher code: ${voucherCode}`);
  
    // Ensure amount is an integer
    const amountInSengi = Math.round(amount);
  
    if (!voucherCode) {
      return { finalAmount: amountInSengi, discountAmount: 0 };
    }
  
    const voucherResult = await this.validateVoucherCode(voucherCode);
    this.logger.log('Voucher validation result:', voucherResult);
  
    if (!voucherResult.valid) {
      return { finalAmount: amountInSengi, discountAmount: 0 };
    }
  
    let discountAmount = 0;
  
    if (voucherResult.discountType === 'percentage') {
      discountAmount = Math.round((amountInSengi * voucherResult.discount!) / 100);
      this.logger.log(`Percentage discount calculation:`);
      this.logger.log(`- Base amount: ${amountInSengi} sengi`);
      this.logger.log(`- Percentage: ${voucherResult.discount}%`);
      this.logger.log(`- Discount amount: ${discountAmount} sengi`);
    } else {
      discountAmount = Math.min(amountInSengi - 200, voucherResult.discount!);
      this.logger.log(`Fixed discount calculation:`);
      this.logger.log(`- Base amount: ${amountInSengi} sengi`);
      this.logger.log(`- Discount amount: ${discountAmount} sengi`);
    }
  
    const finalAmount = Math.max(200, amountInSengi - discountAmount);
    this.logger.log(`Final amount: ${finalAmount} sengi`);
  
    return {
      finalAmount,
      discountAmount,
      voucherDetails: {
        code: voucherCode,
        discountType: voucherResult.discountType!,
        discountValue: voucherResult.discount!,
      },
    };
  }
  
  
  async createVoucher(data: {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountAmount: number;
    expiresAt?: Date;
    maxRedemptions?: number;
  }) {
    this.logger.log(`Creating voucher with code: ${data.code}`);
  
    try {
      // First create a Coupon
      const couponData: Stripe.CouponCreateParams = {
        duration: 'once',  // or 'repeating', 'forever'
      };
  
      // Set discount type
      if (data.discountType === 'percentage') {
        couponData.percent_off = data.discountAmount;
      } else {
        couponData.amount_off = Math.round(data.discountAmount * 100); // Convert to cents
        couponData.currency = 'myr';
      }
  
      // Add expiration if provided
      if (data.expiresAt) {
        couponData.redeem_by = Math.floor(data.expiresAt.getTime() / 1000);
      }
  
      // Add max redemptions if provided
      if (data.maxRedemptions) {
        couponData.max_redemptions = data.maxRedemptions;
      }
  
      const coupon = await this.stripe.coupons.create(couponData);
  
      // Create a Promotion Code with the specified code
      const promotionCode = await this.stripe.promotionCodes.create({
        coupon: coupon.id,
        code: data.code,
        max_redemptions: data.maxRedemptions,
        expires_at: data.expiresAt ? Math.floor(data.expiresAt.getTime() / 1000) : undefined,
      });
  
      return {
        success: true,
        code: promotionCode.code,
        couponId: coupon.id,
        promotionCodeId: promotionCode.id,
        discountType: data.discountType,
        discountAmount: data.discountAmount,
        expiresAt: data.expiresAt,
        maxRedemptions: data.maxRedemptions,
      };
    } catch (error) {
      this.logger.error('Error creating voucher:', error);
      throw error;
    }
  }
}