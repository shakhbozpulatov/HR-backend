import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
export declare class UsersService {
    private userRepository;
    private cryptoUtils;
    constructor(userRepository: Repository<User>, cryptoUtils: CryptoUtils);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(role: UserRole, company_id: string): Promise<User[]>;
    findOne(id: string, user: any): Promise<User>;
    update(id: string, updateUserDto: UpdateUserDto, company: any): Promise<User>;
    remove(id: string, company: string): Promise<void>;
}
