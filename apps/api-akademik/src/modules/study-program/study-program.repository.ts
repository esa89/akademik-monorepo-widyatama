import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudyProgramDto } from './dto/create-study-program.dto';
import { UpdateStudyProgramDto } from './dto/update-study-program.dto';
import { QueryStudyProgramDto } from './dto/query-study-program.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface StudyProgramMapped {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  degree: string;
  accreditation: string | null;
  description: string | null;
  isActive: boolean;
  faculty: { id: string; code: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class StudyProgramRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryStudyProgramDto): Promise<PaginatedResult<StudyProgramMapped>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, facultyId, degree, accreditation, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudyProgramWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (facultyId !== undefined) {
      where.facultyId = facultyId;
    }

    if (degree !== undefined) {
      where.degree = degree;
    }

    if (accreditation !== undefined) {
      where.accreditation = accreditation;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.studyProgram.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          faculty: {
            select: { id: true, code: true, name: true },
          },
        },
      }),
      this.prisma.studyProgram.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<StudyProgramMapped | null> {
    const item = await this.prisma.studyProgram.findUnique({
      where: { id },
      include: {
        faculty: {
          select: { id: true, code: true, name: true },
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string) {
    return this.prisma.studyProgram.findUnique({
      where: { code },
    });
  }

  async create(data: CreateStudyProgramDto) {
    return this.prisma.studyProgram.create({
      data: {
        facultyId: data.facultyId,
        code: data.code,
        name: data.name,
        degree: data.degree,
        accreditation: data.accreditation,
        description: data.description,
        isActive: data.isActive ?? true,
      },
      include: {
        faculty: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateStudyProgramDto) {
    const updateData: Prisma.StudyProgramUpdateInput = {};

    if (data.facultyId !== undefined) updateData.faculty = { connect: { id: data.facultyId } };
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.degree !== undefined) updateData.degree = data.degree;
    if (data.accreditation !== undefined) updateData.accreditation = data.accreditation;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.studyProgram.update({
      where: { id },
      data: updateData,
      include: {
        faculty: {
          select: { id: true, code: true, name: true },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.studyProgram.delete({
      where: { id },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.studyProgram.count({
      where: { code },
    });
    return count > 0;
  }

  async facultyExists(id: string): Promise<boolean> {
    const count = await this.prisma.faculty.count({
      where: { id },
    });
    return count > 0;
  }

  mapToResponse(item: {
    id: string;
    facultyId: string;
    code: string;
    name: string;
    degree: string;
    accreditation: string | null;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    faculty: { id: string; code: string; name: string };
  }): StudyProgramMapped {
    return {
      id: item.id,
      facultyId: item.facultyId,
      code: item.code,
      name: item.name,
      degree: item.degree,
      accreditation: item.accreditation,
      description: item.description,
      isActive: item.isActive,
      faculty: item.faculty,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
