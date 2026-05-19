import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateBahanKajianDto } from './dto/create-bahan-kajian.dto';
import { UpdateBahanKajianDto } from './dto/update-bahan-kajian.dto';
import { QueryBahanKajianDto } from './dto/query-bahan-kajian.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

type BahanKajianWithCount = Prisma.BahanKajianGetPayload<{
  include: { _count: { select: { cplMappings: true } } };
}>;

export interface BahanKajianMapped {
  id: string;
  code: string;
  name: string;
  description: string | null;
  curriculumYear: number;
  isActive: boolean;
  totalCpl: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BahanKajianDetailMapped extends BahanKajianMapped {
  cpls: { id: string; code: string; name: string }[];
}

@Injectable()
export class BahanKajianRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBahanKajianDto): Promise<PaginatedResult<BahanKajianMapped>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, curriculumYear, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BahanKajianWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (curriculumYear !== undefined) {
      where.curriculumYear = curriculumYear;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.bahanKajian.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { cplMappings: true },
          },
        },
      }),
      this.prisma.bahanKajian.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<BahanKajianDetailMapped | null> {
    const item = await this.prisma.bahanKajian.findUnique({
      where: { id },
      include: {
        cplMappings: {
          include: {
            cpl: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    if (!item) return null;

    return {
      ...this.mapToResponse({ ...item, _count: { cplMappings: item.cplMappings.length } }),
      cpls: item.cplMappings.map((m) => ({
        id: m.cpl.id,
        code: m.cpl.code,
        name: m.cpl.name,
      })),
    };
  }

  async findByCode(code: string) {
    return this.prisma.bahanKajian.findUnique({
      where: { code },
    });
  }

  async create(data: CreateBahanKajianDto) {
    return this.prisma.bahanKajian.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        curriculumYear: data.curriculumYear,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateBahanKajianDto) {
    const updateData: Prisma.BahanKajianUpdateInput = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.curriculumYear !== undefined) updateData.curriculumYear = data.curriculumYear;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.bahanKajian.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.bahanKajian.delete({
      where: { id },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.bahanKajian.count({
      where: { code },
    });
    return count > 0;
  }

  async mapCplToBahanKajian(bahanKajianId: string, cplIds: string[]) {
    return this.prisma.$transaction(async (tx) => {
      const bahanKajian = await tx.bahanKajian.findUnique({
        where: { id: bahanKajianId },
      });
      if (!bahanKajian) {
        throw new Error('Bahan Kajian not found');
      }

      const existingCpls = await tx.cpl.findMany({
        where: { id: { in: cplIds } },
        select: { id: true },
      });
      const existingCplIds = new Set(existingCpls.map((c) => c.id));
      const missingCplIds = cplIds.filter((id) => !existingCplIds.has(id));
      if (missingCplIds.length > 0) {
        throw new Error(`CPL not found: ${missingCplIds.join(', ')}`);
      }

      const existingMappings = await tx.cplBahanKajianMapping.findMany({
        where: {
          bahanKajianId,
          cplId: { in: cplIds },
        },
        select: { cplId: true },
      });
      const existingMappingIds = new Set(existingMappings.map((m) => m.cplId));
      const newCplIds = cplIds.filter((id) => !existingMappingIds.has(id));

      if (newCplIds.length === 0) {
        throw new Error('All provided CPLs are already mapped to this Bahan Kajian');
      }

      await tx.cplBahanKajianMapping.createMany({
        data: newCplIds.map((cplId) => ({
          cplId,
          bahanKajianId,
        })),
        skipDuplicates: true,
      });

      return tx.bahanKajian.findUnique({
        where: { id: bahanKajianId },
        include: {
          cplMappings: {
            include: {
              cpl: {
                select: { id: true, code: true, name: true },
              },
            },
          },
        },
      });
    });
  }

  private mapToResponse(item: BahanKajianWithCount): BahanKajianMapped {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      curriculumYear: item.curriculumYear,
      isActive: item.isActive,
      totalCpl: item._count.cplMappings,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
