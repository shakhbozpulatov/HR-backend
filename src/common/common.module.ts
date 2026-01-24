import { Module } from '@nestjs/common';
import { CryptoUtils } from './utils/crypto.utils';
import { TimeUtils } from './utils/time.utils';
import { UserPhotoStorageService } from './services/user-photo-storage.service';

@Module({
  providers: [CryptoUtils, TimeUtils, UserPhotoStorageService],
  exports: [CryptoUtils, TimeUtils, UserPhotoStorageService],
})
export class CommonModule {}
