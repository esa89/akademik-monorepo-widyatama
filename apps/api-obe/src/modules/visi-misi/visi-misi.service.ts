import { Injectable, NotFoundException } from '@nestjs/common';
import { VisiMisiRepository } from './visi-misi.repository';
import { CreateVisiMisiDto } from './dto/create-visi-misi.dto';
import { UpdateVisiMisiDto } from './dto/update-visi-misi.dto';
import { QueryVisiMisiDto } from './dto/query-visi-misi.dto';

@Injectable()
export class VisiMisiService {
  constructor(private readonly repository: VisiMisiRepository) {}

  async findAll(query: QueryVisiMisiDto) {
    const result = await this.repository.findAll(query);
    return {
      success: true,
      statusCode: 200,
      message: 'Visi & Misi retrieved successfully',
      ...result,
    };
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException(`Visi/Misi dengan ID "${id}" tidak ditemukan`);
    return { success: true, statusCode: 200, message: 'Visi/Misi retrieved successfully', data: item };
  }

  async create(data: CreateVisiMisiDto) {
    const item = await this.repository.create(data);
    return { success: true, statusCode: 201, message: 'Visi/Misi berhasil dibuat', data: item };
  }

  async update(id: string, data: UpdateVisiMisiDto) {
    await this.findOne(id);
    const item = await this.repository.update(id, data);
    return { success: true, statusCode: 200, message: 'Visi/Misi berhasil diperbarui', data: item };
  }

  async remove(id: string) {
    await this.findOne(id);
    const item = await this.repository.remove(id);
    return { success: true, statusCode: 200, message: 'Visi/Misi berhasil dihapus', data: item };
  }
}
