import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Param,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from '@/common/decorators/public.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * PUBLIC: User login
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  /**
   * PUBLIC: User registration
   * Can create new company OR join existing company
   */
  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  /**
   * PROTECTED: Admin creates users
   * Requires appropriate role permissions
   */
  @Post('create-user')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  @HttpCode(HttpStatus.CREATED)
  async createUserByAdmin(
    @Body() createUserDto: AdminCreateUserDto,
    @Req() req,
  ) {
    const result = await this.authService.createUserByAdmin(
      createUserDto,
      req.user.user_id,
    );

    return {
      message: 'User created successfully',
      user: {
        user_id: result.user.user_id,
        email: result.user.email,
        role: result.user.role,
        company_id: result.user.company_id,
      },
      temporary_password: result.temporary_password,
      note: 'Please share this temporary password securely with the new user',
    };
  }

  /**
   * PROTECTED: Change own password
   */
  @Patch('change-password')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req,
  ) {
    return await this.authService.changePassword(
      req.user.user_id,
      changePasswordDto,
    );
  }

  /**
   * PROTECTED: Admin resets user password
   */
  @Post('reset-password/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async resetUserPassword(@Param('userId') userId: string, @Req() req) {
    const result = await this.authService.resetUserPassword(
      req.user.user_id,
      userId,
    );

    return {
      message: 'Password reset successfully',
      temporary_password: result.temporary_password,
      note: 'Please share this temporary password securely with the user',
    };
  }

  /**
   * PROTECTED: Get current user profile
   */
  @Get('profile')
  @UseGuards(AuthGuard)
  async getProfile(@Req() req) {
    return {
      user: {
        user_id: req.user.user_id,
        email: req.user.email,
        role: req.user.role,
        company_id: req.user.company_id,
        employee: req.user.employee,
        company: req.user.company,
      },
    };
  }

  /**
   * PROTECTED: Logout (optional - depends on token strategy)
   */
  @Post('logout')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout() {
    // For JWT, logout is typically handled client-side by removing the token
    // If using refresh tokens, implement token blacklist here
    return { message: 'Logged out successfully' };
  }
}
