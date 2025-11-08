import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/modules/users/entities/user.entity';
import { Company } from '@/modules/company/entities/company.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CryptoUtils } from '@/common/utils/crypto.utils';
import { UpdateProfileDto } from '@/modules/auth/dto/update-profile.dto';
import { HcService } from '@/modules/hc/hc.service';
export declare class AuthService {
    private userRepository;
    private companyRepository;
    private jwtService;
    private cryptoUtils;
    private hcService;
    constructor(userRepository: Repository<User>, companyRepository: Repository<Company>, jwtService: JwtService, cryptoUtils: CryptoUtils, hcService: HcService);
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
        hcUser: any;
        hcError?: any;
        syncStatus?: string;
        warning?: string;
    }>;
    getProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<any>;
    changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{
        message: string;
    }>;
    resetUserPassword(adminUserId: string, targetUserId: string): Promise<{
        temporary_password: string;
    }>;
    validateUser(payload: any): Promise<User>;
    private validateUserCreationPermissions;
    private generateCompanyCode;
    private generateTemporaryPassword;
    private getCompanyStatistics;
    private getUserPermissions;
}
