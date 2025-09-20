import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoUtils } from '../utils/crypto.utils';

@Injectable()
export class WebhookGuard implements CanActivate {
  constructor(
    private configService: ConfigService,
    private cryptoUtils: CryptoUtils,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-signature'];
    const idempotencyKey = request.headers['x-idempotency-key'];

    if (!signature || !idempotencyKey) {
      throw new UnauthorizedException('Missing required webhook headers');
    }

    const webhookSecret = this.configService.get('WEBHOOK_SECRET');
    const body = JSON.stringify(request.body);

    const isValid = this.cryptoUtils.verifyHmacSignature(
      body,
      signature,
      webhookSecret,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    // Check timestamp to prevent replay attacks (within 10 minutes)
    const timestamp = request.headers['x-timestamp'];
    if (timestamp) {
      const eventTime = new Date(timestamp);
      const now = new Date();
      const diffMinutes = (now.getTime() - eventTime.getTime()) / (1000 * 60);

      if (diffMinutes > 10) {
        throw new UnauthorizedException('Webhook timestamp too old');
      }
    }

    return true;
  }
}
