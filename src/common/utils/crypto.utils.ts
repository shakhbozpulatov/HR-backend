import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt'; // ← bcrypt import qo'shildi

@Injectable()
export class CryptoUtils {
  verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex'),
    );
  }

  generateHmacSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  comparePassword(password: string, hash: string): boolean {
    return bcrypt.compareSync(password, hash);
  }

  /**
   * Generate HC Person Code
   * Requirements: 1-16 characters, digits and letters only
   * Format: EMP + timestamp(7) + random(6) = 16 chars total
   * Example: EMP1234567ABCD89
   */
  generateHcPersonId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Get last 7 digits from timestamp (ensures uniqueness by time)
    const timestamp = Date.now().toString().slice(-7);

    // Generate 6 random alphanumeric characters
    let randomPart = '';
    for (let i = 0; i < 6; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Format: EMP + 7-digit timestamp + 6 random chars = 16 characters
    return `EMP${timestamp}${randomPart}`;
  }
}
