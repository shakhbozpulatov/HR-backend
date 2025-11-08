export declare class CryptoUtils {
    verifyHmacSignature(payload: string, signature: string, secret: string): boolean;
    generateHmacSignature(payload: string, secret: string): string;
    hashPassword(password: string): string;
    comparePassword(password: string, hash: string): boolean;
    generateHcPersonId(): string;
}
