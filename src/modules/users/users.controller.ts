import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@/common/guards/auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from './entities/user.entity';

@Controller('users')
@UseGuards(AuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async findAll(@Req() req) {
    const { role, company_id } = req.user;
    return await this.usersService.findAll(role, company_id);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.COMPANY_OWNER,
    UserRole.ADMIN,
    UserRole.HR_MANAGER,
  )
  async findOne(@Param('id') id: string, @Req() req) {
    return await this.usersService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req,
  ) {
    return await this.usersService.update(id, updateUserDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.COMPANY_OWNER, UserRole.ADMIN)
  async remove(@Param('id') id: string, @Req() req) {
    await this.usersService.remove(id, req.user);
    return { message: 'User deactivated successfully' };
  }
}
