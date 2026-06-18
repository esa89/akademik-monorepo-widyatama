import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateBodyOfKnowledgeDto } from './dto/create-body-of-knowledge.dto';
import { UpdateBodyOfKnowledgeDto } from './dto/update-body-of-knowledge.dto';
import { QueryBodyOfKnowledgeDto } from './dto/query-body-of-knowledge.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class BodyOfKnowledgeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryBodyOfKnowledgeDto): Promise<PaginatedResult<unknown>> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      curriculumId,
      isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.BodyOfKnowledgeWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (curriculumId !== undefined) {
      where.curriculumId = curriculumId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.bodyOfKnowledge.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.bodyOfKnowledge.count({ where }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async findById(id: string) {
    return this.prisma.bodyOfKnowledge.findUnique({
      where: { id },
    });
  }

  async findByCodeAndCurriculum(code: string, curriculumId: string) {
    return this.prisma.bodyOfKnowledge.findUnique({
      where: { curriculumId_code: { curriculumId, code } },
    });
  }

  async create(data: CreateBodyOfKnowledgeDto) {
    return this.prisma.bodyOfKnowledge.create({
      data: {
        curriculumId: data.curriculumId,
        code: data.code,
        name: data.name,
        reference: data.reference,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateBodyOfKnowledgeDto) {
    const updateData: Prisma.BodyOfKnowledgeUpdateInput = {};

    if (data.curriculumId !== undefined) updateData.curriculumId = data.curriculumId;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.reference !== undefined) updateData.reference = data.reference;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    return this.prisma.bodyOfKnowledge.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.bodyOfKnowledge.delete({
      where: { id },
    });
  }
}
