// payment/stripe.provider.ts
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const StripeProvider: Provider = {
    provide: STRIPE_CLIENT,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
      const stripeKey = configService.get<string>('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        throw new Error('STRIPE_SECRET_KEY is not defined');
      }
      return new Stripe(stripeKey, {
        apiVersion: '2024-12-18.acacia',
      });
    },
  };