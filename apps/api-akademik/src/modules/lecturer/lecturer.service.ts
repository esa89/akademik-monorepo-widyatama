import {
  Injectable, NotFoundException, ConflictException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LecturerRepository } from './lecturer.repository';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { QueryLecturerDto } from './dto/query-lecturer.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class LecturerService {
  private readonly logger = new Logger(LecturerService.name);

  constructor(
    private readonly repository: LecturerRepository,
    private readonly configService: ConfigService,
  ) {}

  private get identityApiUrl(): string {
    return this.configService.get<string>('IDENTITY_API_URL', 'http://localhost:3013');
  }

  async findAll(query: QueryLecturerDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException(`Dosen dengan id '${id}' tidak ditemukan`);
    return item;
  }

  async create(data: CreateLecturerDto) {
    this.logger.log(`Creating Lecturer: ${data.nidn}`);

    await this.validateUniqueness(data);

    const ok = await this.repository.facultyExists(data.facultyId);
    if (!ok) throw new BadRequestException(`Fakultas dengan id '${data.facultyId}' tidak ditemukan`);

    const spOk = await this.repository.studyProgramExists(data.studyProgramId);
    if (!spOk) throw new BadRequestException(`Program Studi dengan id '${data.studyProgramId}' tidak ditemukan`);

    const lecturer = await this.repository.create(data);
    this.logger.log(`Lecturer created: ${lecturer.id}`);

    // Try to create Authentik user (non-blocking)
    const authentikResult = await this.syncToAuthentik(lecturer.id, {
      username: data.username,
      email: data.email,
      name: data.name,
      password: data.password,
    });

    return {
      ...this.repository.mapToResponse(lecturer),
      authentikCreated: authentikResult.success,
      authentikMessage: authentikResult.message,
    };
  }

  async update(id: string, data: UpdateLecturerDto) {
    this.logger.log(`Updating Lecturer: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Dosen dengan id '${id}' tidak ditemukan`);

    if (data.nidn && data.nidn !== existing.nidn) {
      const exists = await this.repository.existsByNidn(data.nidn, id);
      if (exists) throw new ConflictException(`NIDN '${data.nidn}' sudah digunakan`);
    }

    if (data.nrk && data.nrk !== existing.nrk) {
      const exists = await this.repository.existsByNrk(data.nrk, id);
      if (exists) throw new ConflictException(`NRK '${data.nrk}' sudah digunakan`);
    }

    if (data.email && data.email !== existing.email) {
      const exists = await this.repository.existsByEmail(data.email, id);
      if (exists) throw new ConflictException(`Email '${data.email}' sudah digunakan`);
    }

    if (data.facultyId) {
      const ok = await this.repository.facultyExists(data.facultyId);
      if (!ok) throw new BadRequestException(`Fakultas dengan id '${data.facultyId}' tidak ditemukan`);
    }

    if (data.studyProgramId) {
      const ok = await this.repository.studyProgramExists(data.studyProgramId);
      if (!ok) throw new BadRequestException(`Program Studi dengan id '${data.studyProgramId}' tidak ditemukan`);
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Lecturer updated: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    this.logger.log(`Deleting Lecturer: ${id}`);
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Dosen dengan id '${id}' tidak ditemukan`);
    const item = await this.repository.remove(id);
    this.logger.log(`Lecturer deleted: ${item.id}`);
    return item;
  }

  async syncAuthentik(id: string) {
    const lecturer = await this.repository.findById(id);
    if (!lecturer) throw new NotFoundException(`Dosen dengan id '${id}' tidak ditemukan`);

    if (!lecturer.identityUsername) {
      throw new BadRequestException('Dosen tidak memiliki username yang terdaftar');
    }

    const result = await this.syncToAuthentik(id, {
      username: lecturer.identityUsername,
      email: lecturer.email,
      name: lecturer.name,
      password: null,
    });

    if (!result.success) {
      throw new BadRequestException(`Sinkronisasi Authentik gagal: ${result.message}`);
    }

    return { message: 'Berhasil disinkronkan ke Authentik', lecturer: await this.repository.findById(id) };
  }

  async resetPassword(id: string, dto: ResetPasswordDto) {
    const lecturer = await this.repository.findById(id);
    if (!lecturer) throw new NotFoundException(`Dosen dengan id '${id}' tidak ditemukan`);

    if (!lecturer.identityUserId) {
      throw new BadRequestException('Akun Authentik belum dibuat untuk dosen ini');
    }

    try {
      await axios.post(
        `${this.identityApiUrl}/users/${lecturer.identityUserId}/reset-password`,
        { newPassword: dto.newPassword },
      );
      this.logger.log(`Password reset for lecturer: ${id}`);
      return { message: 'Password berhasil direset' };
    } catch (error: any) {
      this.logger.error(`Reset password failed for ${id}:`, error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Gagal mereset password di Authentik',
      );
    }
  }

  private async syncToAuthentik(
    lecturerId: string,
    payload: { username: string; email: string; name: string; password: string | null },
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await axios.post(`${this.identityApiUrl}/users`, {
        username: payload.username,
        email: payload.email,
        name: payload.name,
        password: payload.password,
      });

      const { authentikUserId } = response.data?.data ?? response.data;

      await this.repository.updateAuthentikInfo(lecturerId, {
        identityUserId: authentikUserId,
        authentikStatus: 'ACTIVE',
      });

      this.logger.log(`Authentik user created for lecturer ${lecturerId}: ${authentikUserId}`);
      return { success: true, message: 'Akun Authentik berhasil dibuat' };
    } catch (error: any) {
      this.logger.warn(
        `Authentik sync failed for lecturer ${lecturerId}:`,
        error.response?.data || error.message,
      );
      await this.repository.updateAuthentikStatus(lecturerId, 'NOT_SYNCED');
      return {
        success: false,
        message: error.response?.data?.message || 'Gagal membuat akun Authentik',
      };
    }
  }

  private async validateUniqueness(data: CreateLecturerDto) {
    const [nidn, nrk, email, username] = await Promise.all([
      this.repository.existsByNidn(data.nidn),
      this.repository.existsByNrk(data.nrk),
      this.repository.existsByEmail(data.email),
      this.repository.existsByUsername(data.username),
    ]);

    if (nidn) throw new ConflictException(`NIDN '${data.nidn}' sudah terdaftar`);
    if (nrk) throw new ConflictException(`NRK '${data.nrk}' sudah terdaftar`);
    if (email) throw new ConflictException(`Email '${data.email}' sudah terdaftar`);
    if (username) throw new ConflictException(`Username '${data.username}' sudah digunakan`);
  }
}
