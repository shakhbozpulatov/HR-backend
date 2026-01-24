import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { HcModule } from '@/modules/hc/hc.module';
import { CommonModule } from '@/common/common.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), HcModule, CommonModule],
  controllers: [UsersController],
  providers: [UsersService, CryptoUtils],
  exports: [UsersService],
})
export class UsersModule {}
