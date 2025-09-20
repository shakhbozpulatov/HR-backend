import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/modules/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
export declare class AuthService {
    private userRepository;
    private jwtService;
    private cryptoUtils;
    constructor(userRepository: Repository<User>, jwtService: JwtService, cryptoUtils: CryptoUtils);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: Partial<User>;
    }>;
    validateUser(payload: any): Promise<User>;
}
