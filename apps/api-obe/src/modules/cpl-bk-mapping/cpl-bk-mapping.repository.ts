import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SaveCplBkMappingsDto } from './dto/save-cpl-bk-mappings.dto';
import { QueryCplBkMappingDto } from './dto/query-cpl-bk-mapping.dto';

@Injectable()
export class CplBkMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMatrix(query: QueryCplBkMappingDto) {
    const { curriculumId, curriculumYear } = query;

    const yearFilter = curriculumYear !== undefined ? { curriculumYear } : {};

    const [cpls, bodyOfKnowledges, mappings] = await Promise.all([
      this.prisma.cpl.findMany({
        where: yearFilter,
        orderBy: [{ code: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          curriculumYear: true,
        },
      }),
      this.prisma.bodyOfKnowledge.findMany({
        where: { curriculumId },
        orderBy: [{ code: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          curriculumId: true,
        },
      }),
      this.prisma.cplBodyOfKnowledgeMapping.findMany({
        where: { curriculumId },
        select: {
          cplId: true,
          bodyOfKnowledgeId: true,
        },
      }),
    ]);

    return { cpls, bodyOfKnowledges, mappings };
  }

  async saveMappings(dto: SaveCplBkMappingsDto) {
    const { curriculumId, mappings } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.cplBodyOfKnowledgeMapping.deleteMany({ where: { curriculumId } });

      if (mappings.length > 0) {
        await tx.cplBodyOfKnowledgeMapping.createMany({
          data: mappings.map((m) => ({
            curriculumId,
            cplId: m.cplId,
            bodyOfKnowledgeId: m.bodyOfKnowledgeId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.cplBodyOfKnowledgeMapping.count({ where: { curriculumId } });
    });
  }
}
