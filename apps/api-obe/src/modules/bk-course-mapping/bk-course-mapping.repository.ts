import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SaveBkCourseMappingsDto } from './dto/save-bk-course-mappings.dto';
import { QueryBkCourseMappingDto } from './dto/query-bk-course-mapping.dto';

@Injectable()
export class BkCourseMappingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getMatrix(query: QueryBkCourseMappingDto) {
    const { curriculumId } = query;

    const [bodyOfKnowledges, mappings] = await Promise.all([
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
      this.prisma.bkCourseMapping.findMany({
        where: { curriculumId },
        select: {
          bodyOfKnowledgeId: true,
          courseId: true,
        },
      }),
    ]);

    return { bodyOfKnowledges, mappings };
  }

  async saveMappings(dto: SaveBkCourseMappingsDto) {
    const { curriculumId, mappings } = dto;

    return this.prisma.$transaction(async (tx) => {
      await tx.bkCourseMapping.deleteMany({ where: { curriculumId } });

      if (mappings.length > 0) {
        await tx.bkCourseMapping.createMany({
          data: mappings.map((m) => ({
            curriculumId,
            bodyOfKnowledgeId: m.bodyOfKnowledgeId,
            courseId: m.courseId,
          })),
          skipDuplicates: true,
        });
      }

      return tx.bkCourseMapping.count({ where: { curriculumId } });
    });
  }
}
