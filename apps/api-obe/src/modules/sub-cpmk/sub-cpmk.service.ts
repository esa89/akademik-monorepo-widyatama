import {
  Injectable, NotFoundException, ConflictException, BadRequestException, Logger,
} from '@nestjs/common';
import { SubCpmkRepository } from './sub-cpmk.repository';
import { CreateSubCpmkDto } from './dto/create-sub-cpmk.dto';
import { UpdateSubCpmkDto } from './dto/update-sub-cpmk.dto';
import { QuerySubCpmkDto } from './dto/query-sub-cpmk.dto';

@Injectable()
export class SubCpmkService {
  private readonly logger = new Logger(SubCpmkService.name);

  constructor(private readonly repository: SubCpmkRepository) {}

  async findAll(query: QuerySubCpmkDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException(`Sub CPMK dengan id '${id}' tidak ditemukan`);
    return item;
  }

  async create(data: CreateSubCpmkDto) {
    const cpmkExists = await this.repository.cpmkExists(data.cpmkId);
    if (!cpmkExists) {
      throw new BadRequestException(`CPMK dengan id '${data.cpmkId}' tidak ditemukan`);
    }
    const exists = await this.repository.existsByCodeInCourse(data.code, data.courseId, data.cpmkId);
    if (exists) {
      throw new ConflictException(
        `Sub CPMK dengan kode '${data.code}' sudah ada untuk MK dan CPMK ini`,
      );
    }
    const item = await this.repository.create(data);
    this.logger.log(`Sub CPMK created: ${item.id}`);
    return this.repository.mapToResponse(item);
  }

  async update(id: string, data: UpdateSubCpmkDto) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Sub CPMK dengan id '${id}' tidak ditemukan`);

    const targetCpmkId = data.cpmkId ?? existing.cpmkId;

    if (data.cpmkId && data.cpmkId !== existing.cpmkId) {
      const cpmkExists = await this.repository.cpmkExists(data.cpmkId);
      if (!cpmkExists) throw new BadRequestException(`CPMK dengan id '${data.cpmkId}' tidak ditemukan`);
    }

    if (data.code || data.cpmkId || data.courseId) {
      const targetCourseId = data.courseId ?? existing.courseId;
      const targetCode = data.code ?? existing.code;
      const codeExists = await this.repository.existsByCodeInCourse(targetCode, targetCourseId, targetCpmkId, id);
      if (codeExists) {
        throw new ConflictException(`Sub CPMK dengan kode '${targetCode}' sudah ada untuk MK dan CPMK ini`);
      }
    }

    const item = await this.repository.update(id, data);
    return this.repository.mapToResponse(item);
  }

  async remove(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Sub CPMK dengan id '${id}' tidak ditemukan`);
    return this.repository.remove(id);
  }
}
