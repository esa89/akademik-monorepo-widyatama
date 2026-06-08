import {
  Injectable, Logger, InternalServerErrorException, BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { CreateUserDto } from './dto/create-user.dto';

const DOSEN_GROUP_NAME = 'dosen';

@Injectable()
export class AuthentikService {
  private readonly logger = new Logger(AuthentikService.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = `${this.configService.get<string>('AUTHENTIK_URL', 'http://localhost:9010')}/api/v3`;
    const token = this.configService.get<string>('AUTHENTIK_ADMIN_TOKEN', '');

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async createUser(dto: CreateUserDto): Promise<{ authentikUserId: string }> {
    this.logger.log(`Creating Authentik user: ${dto.username}`);

    try {
      // 1. Create user
      const { data: user } = await this.client.post('/core/users/', {
        username: dto.username,
        email: dto.email,
        name: dto.name,
        is_active: true,
        type: 'internal',
      });

      const authentikUserId = String(user.pk);
      this.logger.log(`Authentik user created: pk=${authentikUserId}`);

      // 2. Set password (if provided)
      if (dto.password) {
        await this.setPassword(authentikUserId, dto.password);
      }

      // 3. Assign DOSEN group
      await this.assignToGroup(authentikUserId, DOSEN_GROUP_NAME);

      return { authentikUserId };
    } catch (error: any) {
      this.logger.error('Create Authentik user failed:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        error.response?.data?.detail || error.response?.data?.username?.[0] || 'Gagal membuat akun Authentik',
      );
    }
  }

  async setPassword(authentikUserId: string, newPassword: string): Promise<void> {
    this.logger.log(`Setting password for Authentik user: ${authentikUserId}`);
    try {
      await this.client.post(`/core/users/${authentikUserId}/set_password/`, {
        password: newPassword,
      });
    } catch (error: any) {
      this.logger.error('Set password failed:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.detail || 'Gagal mengatur password di Authentik',
      );
    }
  }

  async updateUserStatus(authentikUserId: string, isActive: boolean): Promise<void> {
    this.logger.log(`Updating Authentik user status: ${authentikUserId} → active=${isActive}`);
    try {
      await this.client.patch(`/core/users/${authentikUserId}/`, { is_active: isActive });
    } catch (error: any) {
      this.logger.error('Update status failed:', error.response?.data || error.message);
      throw new InternalServerErrorException(
        error.response?.data?.detail || 'Gagal mengubah status akun Authentik',
      );
    }
  }

  async getUser(authentikUserId: string) {
    try {
      const { data } = await this.client.get(`/core/users/${authentikUserId}/`);
      return {
        pk: String(data.pk),
        username: data.username,
        email: data.email,
        name: data.name,
        isActive: data.is_active,
      };
    } catch (error: any) {
      this.logger.error('Get user failed:', error.response?.data || error.message);
      throw new InternalServerErrorException('Gagal mengambil data user Authentik');
    }
  }

  private async assignToGroup(authentikUserId: string, groupName: string): Promise<void> {
    try {
      // Find group by name
      const { data: groups } = await this.client.get(`/core/groups/?search=${groupName}`);
      const group = groups.results?.find(
        (g: { name: string }) => g.name.toLowerCase() === groupName.toLowerCase(),
      );

      if (!group) {
        this.logger.warn(`Group '${groupName}' not found in Authentik, skipping assignment`);
        return;
      }

      // Assign user to group via users_obj field
      const currentUsers: number[] = group.users || [];
      if (!currentUsers.includes(Number(authentikUserId))) {
        await this.client.patch(`/core/groups/${group.pk}/`, {
          users: [...currentUsers, Number(authentikUserId)],
        });
        this.logger.log(`User ${authentikUserId} assigned to group '${groupName}'`);
      }
    } catch (error: any) {
      this.logger.warn(
        `Assign group '${groupName}' failed (non-fatal):`,
        error.response?.data || error.message,
      );
    }
  }
}
