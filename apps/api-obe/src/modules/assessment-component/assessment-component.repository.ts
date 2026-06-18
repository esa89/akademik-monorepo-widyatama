import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAssessmentComponentDto } from './dto/create-assessment-component.dto';
import { UpdateAssessmentComponentDto } from './dto/update-assessment-component.dto';
import { QueryAssessmentComponentDto } from './dto/query-assessment-component.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface AssessmentComponentMapped {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AssessmentComponentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAssessmentComponentDto): Promise<PaginatedResult<AssessmentComponentMapped>> {
    const { page = 1, limit = 10, sortBy = 'code', sortOrder = 'asc', search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AssessmentComponentWhereInput = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.assessmentComponent.findMany({ where, skip, take: limit, orderBy: { [sortBy]: sortOrder } }),
      this.prisma.assessmentComponent.count({ where }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async findById(id: string): Promise<AssessmentComponentMapped | null> {
    return this.prisma.assessmentComponent.findUnique({ where: { id } });
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.assessmentComponent.count({
      where: { code: { equals: code, mode: 'insensitive' }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async create(data: CreateAssessmentComponentDto): Promise<AssessmentComponentMapped> {
    return this.prisma.assessmentComponent.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateAssessmentComponentDto): Promise<AssessmentComponentMapped> {
    const updateData: Prisma.AssessmentComponentUpdateInput = {};
    if (data.code !== undefined)        updateData.code = data.code;
    if (data.name !== undefined)        updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined)    updateData.isActive = data.isActive;
    return this.prisma.assessmentComponent.update({ where: { id }, data: updateData });
  }

  async remove(id: string): Promise<AssessmentComponentMapped> {
    return this.prisma.assessmentComponent.delete({ where: { id } });
  }
}
