import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private authService;
    constructor(configService: ConfigService, authService: AuthService);
    validate(payload: any): Promise<{
        user_id: string;
        email: string;
        role: import("../../users/entities/user.entity").UserRole;
        company_id: string;
        employee_id: string;
        employee: import("../../employees/entities/employee.entity").Employee;
        company: import("../../company/entities/company.entity").Company;
    }>;
}
export {};
