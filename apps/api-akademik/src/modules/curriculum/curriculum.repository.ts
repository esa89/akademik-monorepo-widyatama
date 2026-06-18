import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { QueryCurriculumDto } from './dto/query-curriculum.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface CurriculumMapped {
  id: string;
  studyProgramId: string | null;
  facultyId: string | null;
  scope: 'universitas' | 'fakultas' | 'prodi';
  code: string;
  name: string;
  year: number;
  description: string | null;
  totalSemester: number;
  totalSks: number;
  isActive: boolean;
  studyProgram: { id: string; code: string; name: string; facultyId: string } | null;
  faculty: { id: string; code: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const curriculumInclude = {
  studyProgram: { select: { id: true, code: true, name: true, facultyId: true } },
  faculty: { select: { id: true, code: true, name: true } },
} satisfies Prisma.CurriculumInclude;

@Injectable()
export class CurriculumRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCurriculumDto): Promise<PaginatedResult<CurriculumMapped>> {
    const {
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc',
      search, studyProgramId, facultyId, scope, year, isActive,
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
      // Include prodi-specific curricula AND universitas-level curricula (studyProgramId=null, facultyId=null)
      const scopeFilter: Prisma.CurriculumWhereInput = {
        OR: [{ studyProgramId }, { studyProgramId: null, facultyId: null }],
      };
      where.AND = Array.isArray(where.AND)
        ? [...(where.AND as Prisma.CurriculumWhereInput[]), scopeFilter]
        : [scopeFilter];
    }
    if (facultyId !== undefined) where.facultyId = facultyId;
    if (year !== undefined) where.year = year;
    if (isActive !== undefined) where.isActive = isActive;

    if (scope === 'universitas') {
      where.studyProgramId = null;
      where.facultyId = null;
    } else if (scope === 'fakultas') {
      where.studyProgramId = null;
      where.NOT = { facultyId: null };
    } else if (scope === 'prodi') {
      where.facultyId = null;
      where.NOT = { studyProgramId: null };
    }

    const [data, total] = await Promise.all([
      this.prisma.curriculum.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: curriculumInclude,
      }),
      this.prisma.curriculum.count({ where }),
    ]);

    return createPaginatedResult(data.map((i) => this.mapToResponse(i)), total, page, limit);
  }

  async findById(id: string): Promise<CurriculumMapped | null> {
    const item = await this.prisma.curriculum.findUnique({
      where: { id },
      include: curriculumInclude,
    });
    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string, studyProgramId?: string) {
    return this.prisma.curriculum.findFirst({
      where: { code, ...(studyProgramId ? { studyProgramId } : {}) },
    });
  }

  async create(data: CreateCurriculumDto) {
    return this.prisma.curriculum.create({
      data: {
        studyProgramId: data.studyProgramId ?? null,
        facultyId: data.facultyId ?? null,
        code: data.code,
        name: data.name,
        year: data.year,
        description: data.description,
        totalSemester: data.totalSemester,
        totalSks: data.totalSks,
        isActive: data.isActive ?? true,
      },
      include: curriculumInclude,
    });
  }

  async update(id: string, data: UpdateCurriculumDto) {
    const updateData: Prisma.CurriculumUpdateInput = {};

    if (data.studyProgramId !== undefined) {
      updateData.studyProgram = data.studyProgramId
        ? { connect: { id: data.studyProgramId } }
        : { disconnect: true };
    }
    if (data.facultyId !== undefined) {
      updateData.faculty = data.facultyId
        ? { connect: { id: data.facultyId } }
        : { disconnect: true };
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
      include: curriculumInclude,
    });
  }

  async remove(id: string) {
    return this.prisma.curriculum.delete({ where: { id } });
  }

  async existsByCode(code: string, studyProgramId: string | null, facultyId: string | null, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.curriculum.count({
      where: {
        code,
        studyProgramId: studyProgramId ?? null,
        facultyId: facultyId ?? null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async studyProgramExists(id: string): Promise<boolean> {
    const count = await this.prisma.studyProgram.count({ where: { id } });
    return count > 0;
  }

  async facultyExists(id: string): Promise<boolean> {
    const count = await this.prisma.faculty.count({ where: { id } });
    return count > 0;
  }

  mapToResponse(item: {
    id: string;
    studyProgramId: string | null;
    facultyId: string | null;
    code: string;
    name: string;
    year: number;
    description: string | null;
    totalSemester: number;
    totalSks: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    studyProgram: { id: string; code: string; name: string; facultyId: string } | null;
    faculty: { id: string; code: string; name: string } | null;
  }): CurriculumMapped {
    const scope: 'universitas' | 'fakultas' | 'prodi' =
      item.studyProgramId ? 'prodi' : item.facultyId ? 'fakultas' : 'universitas';
    return {
      id: item.id,
      studyProgramId: item.studyProgramId,
      facultyId: item.facultyId,
      scope,
      code: item.code,
      name: item.name,
      year: item.year,
      description: item.description,
      totalSemester: item.totalSemester,
      totalSks: item.totalSks,
      isActive: item.isActive,
      studyProgram: item.studyProgram,
      faculty: item.faculty,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
