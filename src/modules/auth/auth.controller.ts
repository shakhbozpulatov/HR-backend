import { Controller, Post, Body, UseGuards, Req, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from '@/common/decorators/public.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@/modules/users/entities/user.entity';
import { Roles } from '@/common/decorators/roles.decorator';
import { AdminRegisterDto, RegisterDto } from '@/modules/auth/dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  async login(@Body() loginDto: LoginDto) {
    return await this.authService.login(loginDto);
  }

  @Post('register')
  @Public()
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  @Post('create-user')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.HR_MANAGER)
  async createUserByAdmin(
    @Body() adminRegisterDto: AdminRegisterDto,
    @Req() req,
  ) {
    const user = await this.authService.createUserByAdmin(
      adminRegisterDto,
      req.user.user_id,
    );
    return {
      user: {
        user_id: user.user_id,
        email: user.email,
        role: user.role,
        employee_id: user.employee_id,
      },
    };
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @Body() changePasswordDto: { old_password: string; new_password: string },
    @Req() req,
  ) {
    await this.authService.changePassword(
      req.user.user_id,
      changePasswordDto.old_password,
      changePasswordDto.new_password,
    );
    return { message: 'Password changed successfully' };
  }

  /**
   * Forgot password
   */
  @Post('forgot-password')
  @Public()
  async forgotPassword(@Body() forgotPasswordDto: { email: string }) {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * Reset password
   */
  @Post('reset-password')
  @Public()
  async resetPassword(
    @Body() resetPasswordDto: { token: string; new_password: string },
  ) {
    return await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.new_password,
    );
  }
}
