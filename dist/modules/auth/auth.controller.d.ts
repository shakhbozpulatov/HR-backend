import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserRole } from '@/modules/users/entities/user.entity';
import { UpdateProfileDto } from '@/modules/auth/dto/update-profile.dto';
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
        success: boolean;
        data: any;
        message: string;
    }>;
    getQuickProfile(req: any): Promise<{
        success: boolean;
        data: {
            user_id: any;
            email: any;
            role: any;
            company_id: any;
            employee_id: any;
            employee: {
                code: any;
                full_name: string;
                position: any;
            };
            company: {
                code: any;
                name: any;
            };
        };
        message: string;
    }>;
    updateProfile(updateProfileDto: UpdateProfileDto, req: any): Promise<{
        success: boolean;
        data: any;
        message: string;
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
