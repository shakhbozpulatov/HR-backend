import { Injectable } from '@nestjs/common';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { IPasswordService } from '../interfaces/auth-services.interface';

/**
 * Password Service
 *
 * Single Responsibility: Handle all password-related operations
 * - Hashing passwords
 * - Comparing passwords
 * - Generating temporary passwords
 */
@Injectable()
export class PasswordService implements IPasswordService {
  constructor(private readonly cryptoUtils: CryptoUtils) {}

  /**
   * Hash a plain password
   */
  hashPassword(password: string): string {
    return this.cryptoUtils.hashPassword(password);
  }

  /**
   * Compare plain password with hashed password
   */
  comparePassword(plainPassword: string, hashedPassword: string): boolean {
    return this.cryptoUtils.comparePassword(plainPassword, hashedPassword);
  }

  /**
   * Generate a secure temporary password
   * Format: Contains uppercase, lowercase, numbers, and special characters
   * Length: 12 characters
   */
  generateTemporaryPassword(): string {
    const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lowercase = 'abcdefghjkmnpqrstuvwxyz';
    const numbers = '23456789';
    const special = '!@#$%';

    let password = '';

    // Ensure at least one of each type
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));

    // Fill remaining characters
    const allChars = uppercase + lowercase + numbers;
    for (let i = 4; i < 12; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    // Shuffle password
    return password
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  }
}