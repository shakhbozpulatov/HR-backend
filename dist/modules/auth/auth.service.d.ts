import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/modules/users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { AdminRegisterDto, RegisterDto } from '@/modules/auth/dto/register.dto';
import { Employee } from '@/modules/employees/entities/employee.entity';
export declare class AuthService {
    private userRepository;
    private employeeRepository;
    private jwtService;
    private cryptoUtils;
    constructor(userRepository: Repository<User>, employeeRepository: Repository<Employee>, jwtService: JwtService, cryptoUtils: CryptoUtils);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: Partial<User>;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: Partial<User>;
    }>;
    createUserByAdmin(adminRegisterDto: AdminRegisterDto, adminUserId: string): Promise<User>;
    validateUser(payload: any): Promise<User>;
    private generateEmployeeCode;
    changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
}
