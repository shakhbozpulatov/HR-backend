import { CryptoUtils } from '@/common/utils/crypto.utils';
import { IPasswordService } from '../interfaces/auth-services.interface';
export declare class PasswordService implements IPasswordService {
    private readonly cryptoUtils;
    constructor(cryptoUtils: CryptoUtils);
    hashPassword(password: string): string;
    comparePassword(plainPassword: string, hashedPassword: string): boolean;
    generateTemporaryPassword(): string;
}
