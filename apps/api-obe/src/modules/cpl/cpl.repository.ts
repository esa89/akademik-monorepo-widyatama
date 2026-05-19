import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCplDto } from './dto/create-cpl.dto';
import { UpdateCplDto } from './dto/update-cpl.dto';
import { QueryCplDto } from './dto/query-cpl.dto';
import { CplCategory } from './enums/cpl-category.enum';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CplRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCplDto): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, category, curriculumYear, isActive, graduateProfileId } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CplWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (curriculumYear !== undefined) {
      where.curriculumYear = curriculumYear;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (graduateProfileId !== undefined) {
      where.graduateProfileId = graduateProfileId;
    }

    const [data, total] = await Promise.all([
      this.prisma.cpl.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.cpl.count({ where }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async findById(id: string) {
    return this.prisma.cpl.findUnique({
      where: { id },
    });
  }

  async findByCode(code: string) {
    return this.prisma.cpl.findUnique({
      where: { code },
    });
  }

  async create(data: CreateCplDto) {
    return this.prisma.cpl.create({
      data: {
        code: data.code,
        name: data.name,
        category: data.category,
        description: data.description,
        curriculumYear: data.curriculumYear,
        isActive: data.isActive ?? true,
        graduateProfile: data.graduateProfileId
          ? { connect: { id: data.graduateProfileId } }
          : undefined,
      },
    });
  }

  async update(id: string, data: UpdateCplDto) {
    const updateData: Prisma.CplUpdateInput = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.curriculumYear !== undefined) updateData.curriculumYear = data.curriculumYear;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.graduateProfileId !== undefined) {
      updateData.graduateProfile = data.graduateProfileId
        ? { connect: { id: data.graduateProfileId } }
        : { disconnect: true };
    }

    return this.prisma.cpl.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.cpl.delete({
      where: { id },
    });
  }

  async countByCategory(category: CplCategory): Promise<number> {
    return this.prisma.cpl.count({
      where: {
        category: category,
      },
    });
  }
}
