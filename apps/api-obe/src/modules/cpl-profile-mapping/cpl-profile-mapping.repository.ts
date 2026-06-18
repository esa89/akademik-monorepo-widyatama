import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SaveMappingsDto } from './dto/save-mappings.dto';
import { QueryMappingDto } from './dto/query-mapping.dto';

@Injectable()
export class CplProfileMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMatrix(query: QueryMappingDto) {
    const { curriculumId, curriculumYear } = query;

    const yearFilter = curriculumYear !== undefined ? { curriculumYear } : {};

    const [cpls, graduateProfiles, mappings] = await Promise.all([
      this.prisma.cpl.findMany({
        where: yearFilter,
        orderBy: [{ code: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          category: true,
          curriculumYear: true,
          description: true,
        },
      }),
      this.prisma.graduateProfile.findMany({
        where: yearFilter,
        orderBy: [{ code: 'asc' }],
        select: {
          id: true,
          code: true,
          name: true,
          curriculumYear: true,
          description: true,
        },
      }),
      this.prisma.cplProfileMapping.findMany({
        where: { curriculumId },
        select: {
          cplId: true,
          graduateProfileId: true,
        },
      }),
    ]);

    return { cpls, graduateProfiles, mappings };
  }

  async saveMappings(dto: SaveMappingsDto) {
    const { curriculumId, mappings } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.cplProfileMapping.deleteMany({ where: { curriculumId } });

      if (mappings.length > 0) {
        await tx.cplProfileMapping.createMany({
          data: mappings.map((m) => ({
            curriculumId,
            cplId: m.cplId,
            graduateProfileId: m.graduateProfileId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.cplProfileMapping.count({ where: { curriculumId } });
    });
  }
}
