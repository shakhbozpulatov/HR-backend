import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get(
        'JWT_SECRET',
        'default-secret-change-in-production',
      ),
    });
  }

  async validate(payload: any) {
    try {
      // Validate user exists and is active
      const user = await this.authService.validateUser(payload);

      // Return user object to be attached to request
      return {
        user_id: user.id,
        email: user.email,
        role: user.role,
        company_id: user.company_id,
        employee_id: user.employee_id,
        employee: user.employee,
        company: user.company,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token or user not found');
    }
  }
}
