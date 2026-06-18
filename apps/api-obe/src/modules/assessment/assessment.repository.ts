import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { QueryAssessmentDto } from './dto/query-assessment.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';
import { AssessmentType } from '@prisma/client';

export interface AssessmentMapped {
  id: string;
  subCpmkId: string;
  code: string;
  name: string;
  description: string | null;
  type: AssessmentType;
  weight: number;
  maxScore: number;
  orderNumber: number;
  isActive: boolean;
  subCpmk: { id: string; code: string; name: string };
  cpmk: { id: string; code: string; name: string };
  course: { id: string; code: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AssessmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAssessmentDto): Promise<PaginatedResult<AssessmentMapped>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'orderNumber',
      sortOrder = 'asc',
      search,
      subCpmkId,
      type,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AssessmentWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (subCpmkId !== undefined) {
      where.subCpmkId = subCpmkId;
    }

    if (type !== undefined) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.assessment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subCpmk: {
            select: {
              id: true,
              code: true,
              name: true,
              cpmk: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.assessment.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<AssessmentMapped | null> {
    const item = await this.prisma.assessment.findUnique({
      where: { id },
      include: {
        subCpmk: {
          select: {
            id: true,
            code: true,
            name: true,
            cpmk: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async create(data: CreateAssessmentDto) {
    return this.prisma.assessment.create({
      data: {
        subCpmkId: data.subCpmkId,
        code: data.code,
        name: data.name,
        description: data.description,
        type: data.type,
        weight: data.weight,
        maxScore: data.maxScore,
        orderNumber: data.orderNumber,
        isActive: data.isActive ?? true,
      },
      include: {
        subCpmk: {
          select: {
            id: true,
            code: true,
            name: true,
            cpmk: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: UpdateAssessmentDto) {
    const updateData: Prisma.AssessmentUpdateInput = {};

    if (data.subCpmkId !== undefined) updateData.subCpmk = { connect: { id: data.subCpmkId } };
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.maxScore !== undefined) updateData.maxScore = data.maxScore;
    if (data.orderNumber !== undefined) updateData.orderNumber = data.orderNumber;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.assessment.update({
      where: { id },
      data: updateData,
      include: {
        subCpmk: {
          select: {
            id: true,
            code: true,
            name: true,
            cpmk: {
              select: { id: true, code: true, name: true },
            },
          },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.assessment.delete({
      where: { id },
    });
  }

  async existsByCodeAndSubCpmk(code: string, subCpmkId: string): Promise<boolean> {
    const count = await this.prisma.assessment.count({
      where: { code, subCpmkId },
    });
    return count > 0;
  }

  async subCpmkExists(id: string): Promise<boolean> {
    const count = await this.prisma.subCpmk.count({
      where: { id },
    });
    return count > 0;
  }

  async getTotalWeightBySubCpmk(subCpmkId: string): Promise<number> {
    const result = await this.prisma.assessment.aggregate({
      where: { subCpmkId },
      _sum: { weight: true },
    });
    return result._sum.weight ?? 0;
  }

  async getTotalWeightBySubCpmkExcluding(subCpmkId: string, excludeId: string): Promise<number> {
    const result = await this.prisma.assessment.aggregate({
      where: {
        subCpmkId,
        id: { not: excludeId },
      },
      _sum: { weight: true },
    });
    return result._sum.weight ?? 0;
  }

  mapToResponse(item: {
    id: string;
    subCpmkId: string;
    code: string;
    name: string;
    description: string | null;
    type: AssessmentType;
    weight: number;
    maxScore: number;
    orderNumber: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    subCpmk: {
      id: string;
      code: string;
      name: string;
      cpmk: { id: string; code: string; name: string } | null;
    };
  }): AssessmentMapped {
    const cpmk = item.subCpmk.cpmk;
    return {
      id: item.id,
      subCpmkId: item.subCpmkId,
      code: item.code,
      name: item.name,
      description: item.description,
      type: item.type,
      weight: item.weight,
      maxScore: item.maxScore,
      orderNumber: item.orderNumber,
      isActive: item.isActive,
      subCpmk: {
        id: item.subCpmk.id,
        code: item.subCpmk.code,
        name: item.subCpmk.name,
      },
      cpmk: {
        id: cpmk?.id ?? '',
        code: cpmk?.code ?? '',
        name: cpmk?.name ?? '',
      },
      course: { id: '', code: '', name: '' },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
