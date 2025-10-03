import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@/modules/users/entities/user.entity';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: any;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: any;
    }>;
    createUserByAdmin(createUserDto: AdminCreateUserDto, req: any): Promise<{
        message: string;
        user: {
            user_id: string;
            email: string;
            role: UserRole;
            company_id: string;
        };
        temporary_password: string;
        note: string;
    }>;
    changePassword(changePasswordDto: ChangePasswordDto, req: any): Promise<{
        message: string;
    }>;
    resetUserPassword(userId: string, req: any): Promise<{
        message: string;
        temporary_password: string;
        note: string;
    }>;
    getProfile(req: any): Promise<{
        user: {
            user_id: any;
            email: any;
            role: any;
            company_id: any;
            employee: any;
            company: any;
        };
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
