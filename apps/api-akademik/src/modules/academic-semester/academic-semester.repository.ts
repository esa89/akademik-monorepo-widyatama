import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAcademicSemesterDto } from './dto/create-academic-semester.dto';
import { UpdateAcademicSemesterDto } from './dto/update-academic-semester.dto';
import { QueryAcademicSemesterDto } from './dto/query-academic-semester.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface AcademicSemesterMapped {
  id: string;
  code: string;
  name: string;
  academicYear: string;
  semesterType: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class AcademicSemesterRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAcademicSemesterDto): Promise<PaginatedResult<AcademicSemesterMapped>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'desc',
      search,
      academicYear,
      semesterType,
      isActive,
      isCurrent,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AcademicSemesterWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { academicYear: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (academicYear !== undefined) {
      where.academicYear = academicYear;
    }

    if (semesterType !== undefined) {
      where.semesterType = semesterType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isCurrent !== undefined) {
      where.isCurrent = isCurrent;
    }

    const [data, total] = await Promise.all([
      this.prisma.academicSemester.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.academicSemester.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<AcademicSemesterMapped | null> {
    const item = await this.prisma.academicSemester.findUnique({
      where: { id },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string) {
    return this.prisma.academicSemester.findUnique({
      where: { code },
    });
  }

  async findCurrent(): Promise<AcademicSemesterMapped | null> {
    const item = await this.prisma.academicSemester.findFirst({
      where: { isCurrent: true },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async create(data: CreateAcademicSemesterDto) {
    return this.prisma.academicSemester.create({
      data: {
        code: data.code,
        name: data.name,
        academicYear: data.academicYear,
        semesterType: data.semesterType,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
        isCurrent: data.isCurrent ?? false,
      },
    });
  }

  async update(id: string, data: UpdateAcademicSemesterDto) {
    const updateData: Prisma.AcademicSemesterUpdateInput = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.academicYear !== undefined) updateData.academicYear = data.academicYear;
    if (data.semesterType !== undefined) updateData.semesterType = data.semesterType;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.isCurrent !== undefined) updateData.isCurrent = data.isCurrent;

    return this.prisma.academicSemester.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.academicSemester.delete({
      where: { id },
    });
  }

  async setCurrent(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.academicSemester.updateMany({
        where: { isCurrent: true },
        data: { isCurrent: false },
      });

      const updated = await tx.academicSemester.update({
        where: { id },
        data: { isCurrent: true },
      });

      return updated;
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.academicSemester.count({
      where: { code },
    });
    return count > 0;
  }

  mapToResponse(item: {
    id: string;
    code: string;
    name: string;
    academicYear: string;
    semesterType: string;
    startDate: Date;
    endDate: Date;
    isActive: boolean;
    isCurrent: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): AcademicSemesterMapped {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      academicYear: item.academicYear,
      semesterType: item.semesterType,
      startDate: item.startDate,
      endDate: item.endDate,
      isActive: item.isActive,
      isCurrent: item.isCurrent,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
