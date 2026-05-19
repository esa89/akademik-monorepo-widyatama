import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { QueryRubricDto } from './dto/query-rubric.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface RubricMapped {
  id: string;
  assessmentId: string;
  code: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  orderNumber: number;
  isActive: boolean;
  assessment: { id: string; code: string; name: string };
  subCpmk: { id: string; code: string; name: string };
  cpmk: { id: string; code: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class RubricRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRubricDto): Promise<PaginatedResult<RubricMapped>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'orderNumber',
      sortOrder = 'asc',
      search,
      assessmentId,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.RubricWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (assessmentId !== undefined) {
      where.assessmentId = assessmentId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.rubric.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          assessment: {
            select: {
              id: true,
              code: true,
              name: true,
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
          },
        },
      }),
      this.prisma.rubric.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<RubricMapped | null> {
    const item = await this.prisma.rubric.findUnique({
      where: { id },
      include: {
        assessment: {
          select: {
            id: true,
            code: true,
            name: true,
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
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async create(data: CreateRubricDto) {
    return this.prisma.rubric.create({
      data: {
        assessmentId: data.assessmentId,
        code: data.code,
        name: data.name,
        description: data.description,
        weight: data.weight,
        maxScore: data.maxScore,
        orderNumber: data.orderNumber,
        isActive: data.isActive ?? true,
      },
      include: {
        assessment: {
          select: {
            id: true,
            code: true,
            name: true,
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
        },
      },
    });
  }

  async update(id: string, data: UpdateRubricDto) {
    const updateData: Prisma.RubricUpdateInput = {};

    if (data.assessmentId !== undefined) updateData.assessment = { connect: { id: data.assessmentId } };
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.maxScore !== undefined) updateData.maxScore = data.maxScore;
    if (data.orderNumber !== undefined) updateData.orderNumber = data.orderNumber;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.rubric.update({
      where: { id },
      data: updateData,
      include: {
        assessment: {
          select: {
            id: true,
            code: true,
            name: true,
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
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.rubric.delete({
      where: { id },
    });
  }

  async existsByCodeAndAssessment(code: string, assessmentId: string): Promise<boolean> {
    const count = await this.prisma.rubric.count({
      where: { code, assessmentId },
    });
    return count > 0;
  }

  async assessmentExists(id: string): Promise<boolean> {
    const count = await this.prisma.assessment.count({
      where: { id },
    });
    return count > 0;
  }

  async getTotalWeightByAssessment(assessmentId: string): Promise<number> {
    const result = await this.prisma.rubric.aggregate({
      where: { assessmentId },
      _sum: { weight: true },
    });
    return result._sum.weight ?? 0;
  }

  async getTotalWeightByAssessmentExcluding(assessmentId: string, excludeId: string): Promise<number> {
    const result = await this.prisma.rubric.aggregate({
      where: {
        assessmentId,
        id: { not: excludeId },
      },
      _sum: { weight: true },
    });
    return result._sum.weight ?? 0;
  }

  mapToResponse(item: {
    id: string;
    assessmentId: string;
    code: string;
    name: string;
    description: string | null;
    weight: number;
    maxScore: number;
    orderNumber: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    assessment: {
      id: string;
      code: string;
      name: string;
      subCpmk: {
        id: string;
        code: string;
        name: string;
        cpmk: { id: string; code: string; name: string };
      };
    };
  }): RubricMapped {
    return {
      id: item.id,
      assessmentId: item.assessmentId,
      code: item.code,
      name: item.name,
      description: item.description,
      weight: item.weight,
      maxScore: item.maxScore,
      orderNumber: item.orderNumber,
      isActive: item.isActive,
      assessment: {
        id: item.assessment.id,
        code: item.assessment.code,
        name: item.assessment.name,
      },
      subCpmk: {
        id: item.assessment.subCpmk.id,
        code: item.assessment.subCpmk.code,
        name: item.assessment.subCpmk.name,
      },
      cpmk: {
        id: item.assessment.subCpmk.cpmk.id,
        code: item.assessment.subCpmk.cpmk.code,
        name: item.assessment.subCpmk.cpmk.name,
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
