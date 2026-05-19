import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateGraduateProfileDto } from './dto/create-graduate-profile.dto';
import { UpdateGraduateProfileDto } from './dto/update-graduate-profile.dto';
import { QueryGraduateProfileDto } from './dto/query-graduate-profile.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

type GraduateProfileWithCount = Prisma.GraduateProfileGetPayload<{
  include: { _count: { select: { cpls: true } } };
}>;

export interface GraduateProfileMapped {
  id: string;
  code: string;
  name: string;
  description: string | null;
  vision: string | null;
  mission: string | null;
  curriculumYear: number;
  isActive: boolean;
  totalCpl: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class GraduatesProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryGraduateProfileDto): Promise<PaginatedResult<GraduateProfileMapped>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, curriculumYear, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.GraduateProfileWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (curriculumYear !== undefined) {
      where.curriculumYear = curriculumYear;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.graduateProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { cpls: true },
          },
        },
      }),
      this.prisma.graduateProfile.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<GraduateProfileMapped | null> {
    const item = await this.prisma.graduateProfile.findUnique({
      where: { id },
      include: {
        _count: {
          select: { cpls: true },
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string) {
    return this.prisma.graduateProfile.findUnique({
      where: { code },
    });
  }

  async create(data: CreateGraduateProfileDto) {
    return this.prisma.graduateProfile.create({
      data: {
        code: data.code,
        name: data.name,
        description: data.description,
        vision: data.vision,
        mission: data.mission,
        curriculumYear: data.curriculumYear,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateGraduateProfileDto) {
    const updateData: Prisma.GraduateProfileUpdateInput = {};

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.vision !== undefined) updateData.vision = data.vision;
    if (data.mission !== undefined) updateData.mission = data.mission;
    if (data.curriculumYear !== undefined) updateData.curriculumYear = data.curriculumYear;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.graduateProfile.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.graduateProfile.delete({
      where: { id },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.graduateProfile.count({
      where: { code },
    });
    return count > 0;
  }

  private mapToResponse(item: GraduateProfileWithCount): GraduateProfileMapped {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      vision: item.vision,
      mission: item.mission,
      curriculumYear: item.curriculumYear,
      isActive: item.isActive,
      totalCpl: item._count.cpls,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
