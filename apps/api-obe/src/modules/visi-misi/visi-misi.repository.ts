import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateVisiMisiDto } from './dto/create-visi-misi.dto';
import { UpdateVisiMisiDto } from './dto/update-visi-misi.dto';
import { QueryVisiMisiDto } from './dto/query-visi-misi.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class VisiMisiRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryVisiMisiDto): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 10, sortBy = 'orderNumber', sortOrder = 'asc', type, curriculumYear, isActive } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VisiMisiWhereInput = {};
    if (type) where.type = type;
    if (curriculumYear !== undefined) where.curriculumYear = curriculumYear;
    if (isActive !== undefined) where.isActive = isActive;

    const validSortFields = ['orderNumber', 'type', 'curriculumYear', 'createdAt'];
    const safeSort = validSortFields.includes(sortBy) ? sortBy : 'orderNumber';

    const [data, total] = await Promise.all([
      this.prisma.visiMisi.findMany({ where, skip, take: limit, orderBy: { [safeSort]: sortOrder } }),
      this.prisma.visiMisi.count({ where }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async findById(id: string) {
    return this.prisma.visiMisi.findUnique({ where: { id } });
  }

  async create(data: CreateVisiMisiDto) {
    return this.prisma.visiMisi.create({
      data: {
        type:          data.type,
        content:       data.content,
        curriculumYear: data.curriculumYear,
        orderNumber:   data.orderNumber ?? 1,
        isActive:      data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateVisiMisiDto) {
    const updateData: Prisma.VisiMisiUpdateInput = {};
    if (data.type !== undefined)          updateData.type = data.type;
    if (data.content !== undefined)       updateData.content = data.content;
    if (data.curriculumYear !== undefined) updateData.curriculumYear = data.curriculumYear;
    if (data.orderNumber !== undefined)   updateData.orderNumber = data.orderNumber;
    if (data.isActive !== undefined)      updateData.isActive = data.isActive;

    return this.prisma.visiMisi.update({ where: { id }, data: updateData });
  }

  async remove(id: string) {
    return this.prisma.visiMisi.delete({ where: { id } });
  }
}
