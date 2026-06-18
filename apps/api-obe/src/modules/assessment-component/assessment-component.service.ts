import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { AssessmentComponentRepository } from './assessment-component.repository';
import { CreateAssessmentComponentDto } from './dto/create-assessment-component.dto';
import { UpdateAssessmentComponentDto } from './dto/update-assessment-component.dto';
import { QueryAssessmentComponentDto } from './dto/query-assessment-component.dto';

@Injectable()
export class AssessmentComponentService {
  private readonly logger = new Logger(AssessmentComponentService.name);

  constructor(private readonly repository: AssessmentComponentRepository) {}

  async findAll(query: QueryAssessmentComponentDto) {
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    const item = await this.repository.findById(id);
    if (!item) throw new NotFoundException(`Komponen Penilaian dengan id '${id}' tidak ditemukan`);
    return item;
  }

  async create(data: CreateAssessmentComponentDto) {
    const exists = await this.repository.existsByCode(data.code);
    if (exists) throw new ConflictException(`Kode komponen '${data.code}' sudah digunakan`);
    const item = await this.repository.create(data);
    this.logger.log(`AssessmentComponent created: ${item.id} (${item.code})`);
    return item;
  }

  async update(id: string, data: UpdateAssessmentComponentDto) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Komponen Penilaian dengan id '${id}' tidak ditemukan`);
    if (data.code && data.code.toLowerCase() !== existing.code.toLowerCase()) {
      const exists = await this.repository.existsByCode(data.code, id);
      if (exists) throw new ConflictException(`Kode komponen '${data.code}' sudah digunakan`);
    }
    return this.repository.update(id, data);
  }

  async remove(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) throw new NotFoundException(`Komponen Penilaian dengan id '${id}' tidak ditemukan`);
    return this.repository.remove(id);
  }
}
