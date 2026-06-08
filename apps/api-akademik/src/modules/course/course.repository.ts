import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface CourseMapped {
  id: string;
  curriculumId: string | null;
  facultyId: string | null;
  code: string;
  name: string;
  description: string | null;
  sks: number;
  semester: number;
  isActive: boolean;
  curriculum: { id: string; code: string; name: string; studyProgramId: string | null; facultyId: string | null } | null;
  faculty: { id: string; code: string; name: string } | null;
  studyProgram: { id: string; code: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const courseInclude = {
  curriculum: {
    select: {
      id: true, code: true, name: true,
      studyProgramId: true, facultyId: true,
      studyProgram: { select: { id: true, code: true, name: true } },
    },
  },
  faculty: { select: { id: true, code: true, name: true } },
} satisfies Prisma.CourseInclude;

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryCourseDto): Promise<PaginatedResult<CourseMapped>> {
    const {
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc',
      search, curriculumId, semester, isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {};
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (curriculumId !== undefined) where.curriculumId = curriculumId;
    if (semester !== undefined) where.semester = semester;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.course.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: courseInclude,
      }),
      this.prisma.course.count({ where }),
    ]);

    return createPaginatedResult(data.map((i) => this.mapToResponse(i)), total, page, limit);
  }

  async findById(id: string): Promise<CourseMapped | null> {
    const item = await this.prisma.course.findUnique({
      where: { id },
      include: courseInclude,
    });
    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string) {
    return this.prisma.course.findUnique({ where: { code } });
  }

  async create(data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        curriculumId: data.curriculumId ?? null,
        facultyId: data.facultyId ?? null,
        code: data.code,
        name: data.name,
        description: data.description,
        sks: data.sks,
        semester: data.semester,
        isActive: data.isActive ?? true,
      },
      include: courseInclude,
    });
  }

  async update(id: string, data: UpdateCourseDto) {
    const updateData: Prisma.CourseUpdateInput = {};

    if (data.curriculumId !== undefined) {
      updateData.curriculum = data.curriculumId
        ? { connect: { id: data.curriculumId } }
        : { disconnect: true };
    }
    if (data.facultyId !== undefined) {
      updateData.faculty = data.facultyId
        ? { connect: { id: data.facultyId } }
        : { disconnect: true };
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
      include: courseInclude,
    });
  }

  async remove(id: string) {
    return this.prisma.course.delete({ where: { id } });
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.course.count({
      where: { code, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async curriculumExists(id: string): Promise<boolean> {
    const count = await this.prisma.curriculum.count({ where: { id } });
    return count > 0;
  }

  async facultyExists(id: string): Promise<boolean> {
    const count = await this.prisma.faculty.count({ where: { id } });
    return count > 0;
  }

  mapToResponse(item: {
    id: string;
    curriculumId: string | null;
    facultyId: string | null;
    code: string;
    name: string;
    description: string | null;
    sks: number;
    semester: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    curriculum: { id: string; code: string; name: string; studyProgramId: string | null; facultyId: string | null; studyProgram: { id: string; code: string; name: string } | null } | null;
    faculty: { id: string; code: string; name: string } | null;
  }): CourseMapped {
    return {
      id: item.id,
      curriculumId: item.curriculumId,
      facultyId: item.facultyId,
      code: item.code,
      name: item.name,
      description: item.description,
      sks: item.sks,
      semester: item.semester,
      isActive: item.isActive,
      curriculum: item.curriculum
        ? { id: item.curriculum.id, code: item.curriculum.code, name: item.curriculum.name, studyProgramId: item.curriculum.studyProgramId, facultyId: item.curriculum.facultyId }
        : null,
      faculty: item.faculty ?? null,
      studyProgram: item.curriculum?.studyProgram ?? null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
