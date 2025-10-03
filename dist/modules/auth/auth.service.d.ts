import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/modules/users/entities/user.entity';
import { Employee } from '@/modules/employees/entities/employee.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
export declare class AuthService {
    private userRepository;
    private employeeRepository;
    private companyRepository;
    private jwtService;
    private cryptoUtils;
    constructor(userRepository: Repository<User>, employeeRepository: Repository<Employee>, companyRepository: Repository<Company>, jwtService: JwtService, cryptoUtils: CryptoUtils);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: any;
    }>;
    createUserByAdmin(createUserDto: AdminCreateUserDto, actorUserId: string): Promise<{
        user: User;
        temporary_password: string;
    }>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    resetUserPassword(adminUserId: string, targetUserId: string): Promise<{
        temporary_password: string;
    }>;
    validateUser(payload: any): Promise<User>;
    private validateUserCreationPermissions;
    private generateCompanyCode;
    private generateEmployeeCode;
    private generateTemporaryPassword;
}
