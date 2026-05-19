import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface CourseMapped {
  id: string;
  curriculumId: string;
  code: string;
  name: string;
  description: string | null;
  sks: number;
  semester: number;
  isActive: boolean;
  curriculum: { id: string; code: string; name: string };
  studyProgram: { id: string; code: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCourseDto): Promise<PaginatedResult<CourseMapped>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      curriculumId,
      semester,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (curriculumId !== undefined) {
      where.curriculumId = curriculumId;
    }

    if (semester !== undefined) {
      where.semester = semester;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          curriculum: {
            select: { id: true, code: true, name: true, studyProgram: { select: { id: true, code: true, name: true } } },
          },
        },
      }),
      this.prisma.course.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<CourseMapped | null> {
    const item = await this.prisma.course.findUnique({
      where: { id },
      include: {
        curriculum: {
          select: { id: true, code: true, name: true, studyProgram: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string) {
    return this.prisma.course.findUnique({
      where: { code },
    });
  }

  async create(data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        curriculumId: data.curriculumId,
        code: data.code,
        name: data.name,
        description: data.description,
        sks: data.sks,
        semester: data.semester,
        isActive: data.isActive ?? true,
      },
      include: {
        curriculum: {
          select: { id: true, code: true, name: true, studyProgram: { select: { id: true, code: true, name: true } } },
        },
      },
    });
  }

  async update(id: string, data: UpdateCourseDto) {
    const updateData: Prisma.CourseUpdateInput = {};

    if (data.curriculumId !== undefined) {
      updateData.curriculum = { connect: { id: data.curriculumId } };
    }
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.sks !== undefined) updateData.sks = data.sks;
    if (data.semester !== undefined) updateData.semester = data.semester;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        curriculum: {
          select: { id: true, code: true, name: true, studyProgram: { select: { id: true, code: true, name: true } } },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.course.delete({
      where: { id },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.course.count({
      where: { code },
    });
    return count > 0;
  }

  async curriculumExists(id: string): Promise<boolean> {
    const count = await this.prisma.curriculum.count({
      where: { id },
    });
    return count > 0;
  }

  mapToResponse(item: {
    id: string;
    curriculumId: string;
    code: string;
    name: string;
    description: string | null;
    sks: number;
    semester: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    curriculum: {
      id: string;
      code: string;
      name: string;
      studyProgram: { id: string; code: string; name: string };
    };
  }): CourseMapped {
    return {
      id: item.id,
      curriculumId: item.curriculumId,
      code: item.code,
      name: item.name,
      description: item.description,
      sks: item.sks,
      semester: item.semester,
      isActive: item.isActive,
      curriculum: {
        id: item.curriculum.id,
        code: item.curriculum.code,
        name: item.curriculum.name,
      },
      studyProgram: item.curriculum.studyProgram,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
