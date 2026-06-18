import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { QueryCpmkCplMappingDto } from './dto/query-cpmk-cpl-mapping.dto';
import { SaveCpmkCplMappingDto } from './dto/save-cpmk-cpl-mapping.dto';

@Injectable()
export class CpmkCplMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMatrix(query: QueryCpmkCplMappingDto) {
    const { curriculumId, curriculumYear } = query;

    const [cpls, cpmks] = await Promise.all([
      this.prisma.cpl.findMany({
        where: curriculumYear ? { curriculumYear } : {},
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true, description: true, curriculumYear: true },
      }),
      this.prisma.cpmk.findMany({
        where: { curriculumId, isActive: true },
        orderBy: { code: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          cpmkMappings: { select: { cplId: true } },
        },
      }),
    ]);

    const mappings = cpmks.flatMap((c) =>
      c.cpmkMappings.map((m) => ({ cpmkId: c.id, cplId: m.cplId })),
    );

    return {
      cpls,
      cpmks: cpmks.map(({ id, code, name }) => ({ id, code, name })),
      mappings,
      totalMapped: mappings.length,
    };
  }

  async saveMappings(dto: SaveCpmkCplMappingDto) {
    const { curriculumId, mappings } = dto;

    return this.prisma.$transaction(async (tx) => {
      // Delete all existing mappings for CPMK in this curriculum
      await tx.cpmkCplMapping.deleteMany({
        where: { cpmk: { curriculumId } },
      });

      if (mappings.length > 0) {
        await tx.cpmkCplMapping.createMany({
          data: mappings.map((m) => ({
            cpmkId: m.cpmkId,
            cplId:  m.cplId,
            weight: 100,
          })),
          skipDuplicates: true,
        });
      }

      return tx.cpmkCplMapping.count({
        where: { cpmk: { curriculumId } },
      });
    });
  }
}
