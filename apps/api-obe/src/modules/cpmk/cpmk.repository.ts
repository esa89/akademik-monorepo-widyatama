import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCpmkDto } from './dto/create-cpmk.dto';
import { UpdateCpmkDto } from './dto/update-cpmk.dto';
import { QueryCpmkDto } from './dto/query-cpmk.dto';
import { MapCplDto } from './dto/map-cpl.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

type CpmkWithCount = Prisma.CpmkGetPayload<{
  include: { _count: { select: { cpmkMappings: true } } };
}>;

export interface CpmkMapped {
  id: string;
  curriculumId: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalCpl: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CpmkDetailMapped extends CpmkMapped {
  cpls: { id: string; code: string; name: string; weight: number }[];
}

@Injectable()
export class CpmkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCpmkDto): Promise<PaginatedResult<CpmkMapped>> {
    const {
      page = 1, limit = 10, sortBy = 'code', sortOrder = 'asc',
      search, curriculumId, isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CpmkWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (curriculumId) where.curriculumId = curriculumId;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.cpmk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: { _count: { select: { cpmkMappings: true } } },
      }),
      this.prisma.cpmk.count({ where }),
    ]);

    return createPaginatedResult(data.map((item) => this.mapToResponse(item)), total, page, limit);
  }

  async findById(id: string): Promise<CpmkDetailMapped | null> {
    const item = await this.prisma.cpmk.findUnique({
      where: { id },
      include: {
        cpmkMappings: {
          include: { cpl: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    if (!item) return null;

    return {
      ...this.mapToResponse({ ...item, _count: { cpmkMappings: item.cpmkMappings.length } }),
      cpls: item.cpmkMappings.map((m) => ({
        id: m.cpl.id, code: m.cpl.code, name: m.cpl.name, weight: m.weight,
      })),
    };
  }

  async findByCodeAndCurriculum(code: string, curriculumId: string) {
    return this.prisma.cpmk.findUnique({
      where: { curriculumId_code: { curriculumId, code } },
    });
  }

  async existsByCodeAndCurriculum(code: string, curriculumId: string): Promise<boolean> {
    const count = await this.prisma.cpmk.count({ where: { code, curriculumId } });
    return count > 0;
  }

  async create(data: CreateCpmkDto) {
    return this.prisma.cpmk.create({
      data: {
        curriculumId: data.curriculumId,
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateCpmkDto) {
    const updateData: Prisma.CpmkUpdateInput = {};
    if (data.curriculumId !== undefined) updateData.curriculumId = data.curriculumId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.cpmk.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    return this.prisma.cpmk.delete({ where: { id } });
  }

  async mapCplToCpmk(cpmkId: string, data: MapCplDto) {
    return this.prisma.$transaction(async (tx) => {
      const cpmk = await tx.cpmk.findUnique({ where: { id: cpmkId } });
      if (!cpmk) throw new Error('CPMK not found');

      const cplIds = data.cpls.map((c) => c.cplId);
      const existingCpls = await tx.cpl.findMany({
        where: { id: { in: cplIds } }, select: { id: true },
      });
      const existingCplIds = new Set(existingCpls.map((c) => c.id));
      const missingCplIds = cplIds.filter((id) => !existingCplIds.has(id));
      if (missingCplIds.length > 0) throw new Error(`CPL not found: ${missingCplIds.join(', ')}`);

      await tx.cpmkCplMapping.createMany({
        data: data.cpls.map((c) => ({ cpmkId, cplId: c.cplId, weight: c.weight })),
        skipDuplicates: true,
      });

      return tx.cpmk.findUnique({
        where: { id: cpmkId },
        include: {
          cpmkMappings: {
            include: { cpl: { select: { id: true, code: true, name: true } } },
          },
        },
      });
    });
  }

  private mapToResponse(item: CpmkWithCount): CpmkMapped {
    return {
      id: item.id,
      curriculumId: item.curriculumId,
      code: item.code,
      name: item.name,
      description: item.description,
      isActive: item.isActive,
      totalCpl: item._count.cpmkMappings,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
