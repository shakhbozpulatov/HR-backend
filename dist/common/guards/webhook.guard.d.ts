import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CryptoUtils } from '../utils/crypto.utils';
export declare class WebhookGuard implements CanActivate {
    private configService;
    private cryptoUtils;
    constructor(configService: ConfigService, cryptoUtils: CryptoUtils);
    canActivate(context: ExecutionContext): boolean;
}
