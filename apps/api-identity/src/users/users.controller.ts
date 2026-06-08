import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { AuthentikService } from './authentik.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly authentikService: AuthentikService) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    const result = await this.authentikService.createUser(dto);
    return { authentikUserId: result.authentikUserId, message: 'Akun Authentik berhasil dibuat' };
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    return this.authentikService.getUser(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    await this.authentikService.updateUserStatus(id, dto.isActive);
    return { message: `Akun ${dto.isActive ? 'diaktifkan' : 'dinonaktifkan'}` };
  }

  @Post(':id/reset-password')
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    await this.authentikService.setPassword(id, dto.newPassword);
    return { message: 'Password berhasil direset' };
  }
}
