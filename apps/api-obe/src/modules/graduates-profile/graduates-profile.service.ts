import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { GraduatesProfileRepository } from './graduates-profile.repository';
import { CreateGraduateProfileDto } from './dto/create-graduate-profile.dto';
import { UpdateGraduateProfileDto } from './dto/update-graduate-profile.dto';
import { QueryGraduateProfileDto } from './dto/query-graduate-profile.dto';

@Injectable()
export class GraduatesProfileService {
  private readonly logger = new Logger(GraduatesProfileService.name);

  constructor(private readonly repository: GraduatesProfileRepository) {}

  async findAll(query: QueryGraduateProfileDto) {
    this.logger.log(`Fetching Graduate Profiles with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Graduate Profile by id: ${id}`);
    const profile = await this.repository.findById(id);

    if (!profile) {
      throw new NotFoundException(`Graduate Profile with id '${id}' not found`);
    }

    return profile;
  }

  async create(data: CreateGraduateProfileDto) {
    this.logger.log(`Creating Graduate Profile with code: ${data.code}`);

    const exists = await this.repository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Graduate Profile with code '${data.code}' already exists`,
      );
    }

    const profile = await this.repository.create(data);
    this.logger.log(`Graduate Profile created with id: ${profile.id}`);
    return profile;
  }

  async update(id: string, data: UpdateGraduateProfileDto) {
    this.logger.log(`Updating Graduate Profile id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Graduate Profile with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `Graduate Profile with code '${data.code}' already exists`,
        );
      }
    }

    const profile = await this.repository.update(id, data);
    this.logger.log(`Graduate Profile updated: ${profile.id}`);
    return profile;
  }

  async remove(id: string) {
    this.logger.log(`Deleting Graduate Profile id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Graduate Profile with id '${id}' not found`);
    }

    const profile = await this.repository.remove(id);
    this.logger.log(`Graduate Profile deleted: ${profile.id}`);
    return profile;
  }
}
