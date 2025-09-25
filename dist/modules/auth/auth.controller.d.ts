import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '@/modules/users/entities/user.entity';
import { AdminRegisterDto, RegisterDto } from '@/modules/auth/dto/register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: Partial<import("@/modules/users/entities/user.entity").User>;
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: Partial<import("@/modules/users/entities/user.entity").User>;
    }>;
    createUserByAdmin(adminRegisterDto: AdminRegisterDto, req: any): Promise<{
        user: {
            user_id: string;
            email: string;
            role: UserRole;
            employee_id: string;
        };
    }>;
    changePassword(changePasswordDto: {
        old_password: string;
        new_password: string;
    }, req: any): Promise<{
        message: string;
    }>;
    forgotPassword(forgotPasswordDto: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: {
        token: string;
        new_password: string;
    }): Promise<{
        message: string;
    }>;
}
