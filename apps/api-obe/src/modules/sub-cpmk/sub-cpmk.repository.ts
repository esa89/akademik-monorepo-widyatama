import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateSubCpmkDto } from './dto/create-sub-cpmk.dto';
import { UpdateSubCpmkDto } from './dto/update-sub-cpmk.dto';
import { QuerySubCpmkDto } from './dto/query-sub-cpmk.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface SubCpmkMapped {
  id: string;
  cpmkId: string;
  code: string;
  name: string;
  description: string | null;
  orderNumber: number;
  targetPercentage: number;
  isActive: boolean;
  cpmk: { id: string; code: string; name: string };
  course: { id: string; code: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SubCpmkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QuerySubCpmkDto): Promise<PaginatedResult<SubCpmkMapped>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'orderNumber',
      sortOrder = 'asc',
      search,
      cpmkId,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SubCpmkWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (cpmkId !== undefined) {
      where.cpmkId = cpmkId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.subCpmk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          cpmk: {
            select: { id: true, code: true, name: true, courseId: true },
          },
        },
      }),
      this.prisma.subCpmk.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<SubCpmkMapped | null> {
    const item = await this.prisma.subCpmk.findUnique({
      where: { id },
      include: {
        cpmk: {
          select: { id: true, code: true, name: true, courseId: true },
        },
      },
    });

    return item ? this.mapToResponse(item) : null;
  }

  async findByCodeAndCpmk(code: string, cpmkId: string) {
    return this.prisma.subCpmk.findUnique({
      where: { code_cpmkId: { code, cpmkId } },
    });
  }

  async create(data: CreateSubCpmkDto) {
    return this.prisma.subCpmk.create({
      data: {
        cpmkId: data.cpmkId,
        code: data.code,
        name: data.name,
        description: data.description,
        orderNumber: data.orderNumber,
        targetPercentage: data.targetPercentage,
        isActive: data.isActive ?? true,
      },
      include: {
        cpmk: {
          select: { id: true, code: true, name: true, courseId: true },
        },
      },
    });
  }

  async update(id: string, data: UpdateSubCpmkDto) {
    const updateData: Prisma.SubCpmkUpdateInput = {};

    if (data.cpmkId !== undefined) updateData.cpmk = { connect: { id: data.cpmkId } };
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.orderNumber !== undefined) updateData.orderNumber = data.orderNumber;
    if (data.targetPercentage !== undefined) updateData.targetPercentage = data.targetPercentage;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.subCpmk.update({
      where: { id },
      data: updateData,
      include: {
        cpmk: {
          select: { id: true, code: true, name: true, courseId: true },
        },
      },
    });
  }

  async remove(id: string) {
    return this.prisma.subCpmk.delete({
      where: { id },
    });
  }

  async existsByCodeAndCpmk(code: string, cpmkId: string): Promise<boolean> {
    const count = await this.prisma.subCpmk.count({
      where: { code, cpmkId },
    });
    return count > 0;
  }

  async cpmkExists(id: string): Promise<boolean> {
    const count = await this.prisma.cpmk.count({
      where: { id },
    });
    return count > 0;
  }

  mapToResponse(item: {
    id: string;
    cpmkId: string;
    code: string;
    name: string;
    description: string | null;
    orderNumber: number;
    targetPercentage: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    cpmk: { id: string; code: string; name: string; courseId: string };
  }): SubCpmkMapped {
    return {
      id: item.id,
      cpmkId: item.cpmkId,
      code: item.code,
      name: item.name,
      description: item.description,
      orderNumber: item.orderNumber,
      targetPercentage: item.targetPercentage,
      isActive: item.isActive,
      cpmk: {
        id: item.cpmk.id,
        code: item.cpmk.code,
        name: item.cpmk.name,
      },
      course: {
        id: item.cpmk.courseId,
        code: '',
        name: '',
      },
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
