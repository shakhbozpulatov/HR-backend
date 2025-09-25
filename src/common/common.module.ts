import { Module } from '@nestjs/common';
import { CryptoUtils } from './utils/crypto.utils';
import { TimeUtils } from './utils/time.utils';

@Module({
  providers: [CryptoUtils, TimeUtils],
  exports: [CryptoUtils, TimeUtils],
})
export class CommonModule {}
