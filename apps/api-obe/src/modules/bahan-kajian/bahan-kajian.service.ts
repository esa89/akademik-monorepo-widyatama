import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BahanKajianRepository } from './bahan-kajian.repository';
import { CreateBahanKajianDto } from './dto/create-bahan-kajian.dto';
import { UpdateBahanKajianDto } from './dto/update-bahan-kajian.dto';
import { QueryBahanKajianDto } from './dto/query-bahan-kajian.dto';
import { MapCplBahanKajianDto } from './dto/map-cpl-bahan-kajian.dto';

@Injectable()
export class BahanKajianService {
  private readonly logger = new Logger(BahanKajianService.name);

  constructor(private readonly repository: BahanKajianRepository) {}

  async findAll(query: QueryBahanKajianDto) {
    this.logger.log(`Fetching Bahan Kajian list with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string) {
    this.logger.log(`Fetching Bahan Kajian by id: ${id}`);
    const item = await this.repository.findById(id);

    if (!item) {
      throw new NotFoundException(`Bahan Kajian with id '${id}' not found`);
    }

    return item;
  }

  async create(data: CreateBahanKajianDto) {
    this.logger.log(`Creating Bahan Kajian with code: ${data.code}`);

    const exists = await this.repository.existsByCode(data.code);
    if (exists) {
      throw new ConflictException(
        `Bahan Kajian with code '${data.code}' already exists`,
      );
    }

    const item = await this.repository.create(data);
    this.logger.log(`Bahan Kajian created with id: ${item.id}`);
    return item;
  }

  async update(id: string, data: UpdateBahanKajianDto) {
    this.logger.log(`Updating Bahan Kajian id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Bahan Kajian with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(data.code);
      if (codeExists) {
        throw new ConflictException(
          `Bahan Kajian with code '${data.code}' already exists`,
        );
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Bahan Kajian updated: ${item.id}`);
    return item;
  }

  async remove(id: string) {
    this.logger.log(`Deleting Bahan Kajian id: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Bahan Kajian with id '${id}' not found`);
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Bahan Kajian deleted: ${item.id}`);
    return item;
  }

  async mapCplToBahanKajian(id: string, dto: MapCplBahanKajianDto) {
    this.logger.log(`Mapping CPLs to Bahan Kajian id: ${id}, cplIds: ${JSON.stringify(dto.cplIds)}`);

    const bahanKajian = await this.repository.findById(id);
    if (!bahanKajian) {
      throw new NotFoundException(`Bahan Kajian with id '${id}' not found`);
    }

    try {
      const result = await this.repository.mapCplToBahanKajian(id, dto.cplIds);
      if (!result) {
        throw new NotFoundException(`Bahan Kajian with id '${id}' not found`);
      }
      this.logger.log(`Mapped ${dto.cplIds.length} CPLs to Bahan Kajian: ${id}`);
      return {
        ...this.mapToDetailResponse(result),
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          throw new NotFoundException(error.message);
        }
        if (error.message.includes('already mapped')) {
          throw new ConflictException(error.message);
        }
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  private mapToDetailResponse(item: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    curriculumYear: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    cplMappings: { cpl: { id: string; code: string; name: string } }[];
  }) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      curriculumYear: item.curriculumYear,
      isActive: item.isActive,
      totalCpl: item.cplMappings.length,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      cpls: item.cplMappings.map((m) => ({
        id: m.cpl.id,
        code: m.cpl.code,
        name: m.cpl.name,
      })),
    };
  }
}
