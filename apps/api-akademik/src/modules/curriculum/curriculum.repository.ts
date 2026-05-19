import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { QueryCurriculumDto } from './dto/query-curriculum.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface CurriculumMapped {
  id: string;
  studyProgramId: string;
  code: string;
  name: string;
  year: number;
  description: string | null;
  totalSemester: number;
  totalSks: number;
  isActive: boolean;
  studyProgram: { id: string; code: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCurriculumDto): Promise<PaginatedResult<CurriculumMapped>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      studyProgramId,
      year,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CurriculumWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (studyProgramId !== undefined) {
      where.studyProgramId = studyProgramId;
    }

    if (year !== undefined) {
      where.year = year;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.curriculum.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          studyProgram: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      this.prisma.curriculum.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<CurriculumMapped | null> {
    const item = await this.prisma.curriculum.findUnique({
      where: { id },
      include: {
        studyProgram: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string) {
    return this.prisma.curriculum.findUnique({
      where: { code },
    });
  }

  async create(data: CreateCurriculumDto) {
    return this.prisma.curriculum.create({
      data: {
        studyProgramId: data.studyProgramId,
        code: data.code,
        name: data.name,
        year: data.year,
        description: data.description,
        totalSemester: data.totalSemester,
        totalSks: data.totalSks,
        isActive: data.isActive ?? true,
      },
      include: {
        studyProgram: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateCurriculumDto) {
    const updateData: Prisma.CurriculumUpdateInput = {};

    if (data.studyProgramId !== undefined) {
      updateData.studyProgram = { connect: { id: data.studyProgramId } };
    }
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.year !== undefined) updateData.year = data.year;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.totalSemester !== undefined) updateData.totalSemester = data.totalSemester;
    if (data.totalSks !== undefined) updateData.totalSks = data.totalSks;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.curriculum.update({
      where: { id },
      data: updateData,
      include: {
        studyProgram: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.curriculum.delete({
      where: { id },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.curriculum.count({
      where: { code },
    });
    return count > 0;
  }

  async studyProgramExists(id: string): Promise<boolean> {
    const count = await this.prisma.studyProgram.count({
      where: { id },
    });
    return count > 0;
  }

  mapToResponse(item: {
    id: string;
    studyProgramId: string;
    code: string;
    name: string;
    year: number;
    description: string | null;
    totalSemester: number;
    totalSks: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    studyProgram: { id: string; code: string; name: string };
  }): CurriculumMapped {
    return {
      id: item.id,
      studyProgramId: item.studyProgramId,
      code: item.code,
      name: item.name,
      year: item.year,
      description: item.description,
      totalSemester: item.totalSemester,
      totalSks: item.totalSks,
      isActive: item.isActive,
      studyProgram: item.studyProgram,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
