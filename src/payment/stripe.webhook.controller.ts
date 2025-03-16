// payment/stripe.webhook.controller.ts
import { 
    Controller, 
    Post, 
    Headers, 
    RawBodyRequest, 
    Req, 
    Logger, 
    BadRequestException, 
    InternalServerErrorException,
  } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Stripe } from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('webhook')
export class StripeWebhookController {
  private stripe: Stripe;
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }

    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }


//   @Post('webhook/stripe')
//   async handleStripeWebhook(
//     @Req() request: RawBodyRequest<any>,
//     @Headers('stripe-signature') signature: string,
//   ) {
//     this.logger.log('Received webhook request');

//     if (!signature) {
//       this.logger.error('No stripe signature provided');
//       throw new BadRequestException('No stripe signature provided');
//     }

//     const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
//     if (!webhookSecret) {
//       this.logger.error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
//       throw new InternalServerErrorException('Webhook secret not configured');
//     }

//     try {
//       const event = this.stripe.webhooks.constructEvent(
//         request.rawBody,
//         signature,
//         webhookSecret,
//       );

//       this.logger.log(`Processing Stripe event: ${event.type}`);

//       switch (event.type) {
//         case 'payment_intent.succeeded':
//           const paymentIntent = event.data.object as Stripe.PaymentIntent;
//           if (!paymentIntent.metadata.uid || !paymentIntent.metadata.planType) {
//             this.logger.error('Missing metadata in payment intent:', paymentIntent.metadata);
//             throw new BadRequestException('Missing required metadata in payment intent');
//           }
//           await this.paymentService.handleSuccessfulPayment(
//             paymentIntent.id,
//             paymentIntent.metadata.uid,
//             paymentIntent.metadata.planType,
//           );
//           this.logger.log(`Successfully processed payment for user: ${paymentIntent.metadata.uid}`);
//           break;

//         case 'charge.succeeded':
//           const charge = event.data.object as Stripe.Charge;
//           if (!charge.payment_intent || !charge.metadata.uid || !charge.metadata.planType) {
//             this.logger.error('Missing metadata in charge:', charge.metadata);
//             throw new BadRequestException('Missing required metadata in charge');
//           }
//           await this.paymentService.handleSuccessfulPayment(
//             charge.payment_intent as string,
//             charge.metadata.uid,
//             charge.metadata.planType,
//           );
//           this.logger.log(`Successfully processed charge for user: ${charge.metadata.uid}`);
//           break;

//         case 'payment_intent.payment_failed':
//           const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
//           await this.paymentService.handleFailedPayment(
//             failedPaymentIntent.id,
//           );
//           this.logger.log(`Payment failed for intent: ${failedPaymentIntent.id}`);
//           break;

//         case 'payment_intent.created':
//           this.logger.log('Payment intent created event received');
//           break;

//         case 'payment_intent.requires_action':
//           this.logger.log('Payment intent requires action event received');
//           break;

//         case 'payment_intent.processing':
//           this.logger.log('Payment intent processing event received');
//           break;

//         default:
//           this.logger.log(`Unhandled event type: ${event.type}`);
//       }

//       return { received: true, type: event.type };
//     } catch (err) {
//       this.logger.error('Error processing webhook:', err);
//       if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
//         throw new BadRequestException('Invalid signature');
//       }
//       throw new InternalServerErrorException('Error processing webhook');
//     }
//   }

  @Post('stripe')
  async handleStripeWebhook(
    @Req() request: RawBodyRequest<any>,
    @Headers('stripe-signature') signature: string,
  ) {
    this.logger.log('Received webhook request');

    if (!signature) {
      this.logger.error('No stripe signature provided');
      throw new BadRequestException('No stripe signature provided');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.error('STRIPE_WEBHOOK_SECRET is not defined in environment variables');
      throw new InternalServerErrorException('Webhook secret not configured');
    }

    try {
      // Log raw body for debugging
      this.logger.debug(`Raw body: ${request.rawBody}`);
      this.logger.debug(`Signature: ${signature}`);

      // Verify webhook signature
      const event = this.stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        webhookSecret,
      );

      this.logger.log(`Processing Stripe event: ${event.type}`);

      // Handle different event types
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          
          if (!paymentIntent.metadata.uid || !paymentIntent.metadata.planType) {
            this.logger.error('Missing metadata:', paymentIntent.metadata);
            throw new BadRequestException('Missing required metadata in payment intent');
          }

          await this.paymentService.handleSuccessfulPayment(
            paymentIntent.id,
            paymentIntent.metadata.uid,
            paymentIntent.metadata.planType,
          );
          this.logger.log(`Successfully processed payment for user: ${paymentIntent.metadata.uid}`);
          break;

        case 'payment_intent.payment_failed':
          const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
          await this.paymentService.handleFailedPayment(
            failedPaymentIntent.id,
          );
          this.logger.log(`Payment failed for intent: ${failedPaymentIntent.id}`);
          break;

        case 'payment_intent.created':
          this.logger.log('Payment intent created event received');
          break;

        case 'payment_intent.processing':
          this.logger.log('Payment intent processing event received');
          break;

        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }

      return { received: true, type: event.type };
    } catch (err) {
      this.logger.error('Error processing webhook:', err);
      if (err instanceof Stripe.errors.StripeSignatureVerificationError) {
        throw new BadRequestException('Invalid signature');
      }
      throw new InternalServerErrorException('Error processing webhook');
    }
  }
}