import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { QueryFacultyDto } from './dto/query-faculty.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

type FacultyWithCount = Prisma.FacultyGetPayload<{
  include: { _count: { select: { studyPrograms: true } } };
}>;

export interface FacultyMapped {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  totalStudyProgram: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class FacultyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryFacultyDto): Promise<PaginatedResult<FacultyMapped>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.FacultyWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { studyPrograms: true },
          },
        },
      }),
      this.prisma.faculty.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<FacultyMapped | null> {
    const item = await this.prisma.faculty.findUnique({
      where: { id },
      include: {
        _count: {
          select: { studyPrograms: true },
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string) {
    return this.prisma.faculty.findUnique({
      where: { code },
    });
  }

  async create(data: CreateFacultyDto) {
    return this.prisma.faculty.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateFacultyDto) {
    const updateData: Prisma.FacultyUpdateInput = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.faculty.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.faculty.delete({
      where: { id },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.faculty.count({
      where: { code },
    });
    return count > 0;
  }

  private mapToResponse(item: FacultyWithCount): FacultyMapped {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      isActive: item.isActive,
      totalStudyProgram: item._count.studyPrograms,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
