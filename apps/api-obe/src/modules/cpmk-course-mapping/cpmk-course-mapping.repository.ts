import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SaveCpmkCourseMappingDto } from './dto/save-cpmk-course-mapping.dto';
import { QueryCpmkCourseMappingDto } from './dto/query-cpmk-course-mapping.dto';

@Injectable()
export class CpmkCourseMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMatrix(query: QueryCpmkCourseMappingDto) {
    const { curriculumId, curriculumYear } = query;

    const [cpls, allCpmks] = await Promise.all([
      this.prisma.cpl.findMany({
        where: curriculumYear ? { curriculumYear } : {},
        orderBy: { code: 'asc' },
        select: { id: true, code: true, name: true, description: true, curriculumYear: true },
      }),
      this.prisma.cpmk.findMany({
        where: { curriculumId },
        orderBy: { code: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          cpmkMappings: {
            select: {
              cplId: true,
              weight: true,
              cpl: { select: { id: true, code: true, name: true } },
            },
          },
          courseMappings: { select: { courseId: true } },
        },
      }),
    ]);

    const toRow = (c: typeof allCpmks[0]) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      courseIds: c.courseMappings.map((m) => m.courseId),
      cpls: c.cpmkMappings.map((m) => ({ id: m.cpl.id, code: m.cpl.code, name: m.cpl.name })),
    });

    const matrix = cpls
      .map((cpl) => ({
        cpl,
        cpmks: allCpmks
          .filter((c) => c.cpmkMappings.some((m) => m.cplId === cpl.id))
          .map(toRow),
      }))
      .filter((row) => row.cpmks.length > 0);

    const unmappedCpmks = allCpmks
      .filter((c) => c.cpmkMappings.length === 0)
      .map(toRow);

    return {
      matrix,
      unmappedCpmks,
      totalCpl:     matrix.length,
      totalCpmk:    allCpmks.length,
      mappedToCpl:  allCpmks.filter((c) => c.cpmkMappings.length > 0).length,
      mappedToMk:   allCpmks.filter((c) => c.courseMappings.length > 0).length,
    };
  }

  async saveMappings(dto: SaveCpmkCourseMappingDto) {
    const { cpmkId, courseIds } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.cpmkCourseMapping.deleteMany({ where: { cpmkId } });

      if (courseIds.length > 0) {
        await tx.cpmkCourseMapping.createMany({
          data: courseIds.map((courseId) => ({ cpmkId, courseId })),
          skipDuplicates: true,
        });
      }

      return tx.cpmkCourseMapping.count({ where: { cpmkId } });
    });
  }

  async getCoursesForCpmk(cpmkId: string): Promise<string[]> {
    const mappings = await this.prisma.cpmkCourseMapping.findMany({
      where: { cpmkId },
      select: { courseId: true },
    });
    return mappings.map((m) => m.courseId);
  }
}
