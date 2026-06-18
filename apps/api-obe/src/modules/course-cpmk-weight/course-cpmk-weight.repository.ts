import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { WeightEntryDto } from './dto/bulk-save-course-cpmk-weight.dto';

export interface WeightEntryMapped {
  id: string;
  courseId: string;
  cpmkId: string;
  assessmentComponentId: string;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
  cpmk: { id: string; code: string; name: string };
  assessmentComponent: { id: string; code: string; name: string };
}

const INCLUDE = {
  cpmk: { select: { id: true, code: true, name: true } },
  assessmentComponent: { select: { id: true, code: true, name: true } },
} as const;

@Injectable()
export class CourseCpmkWeightRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCourseId(courseId: string): Promise<WeightEntryMapped[]> {
    return this.prisma.courseCpmkAssessmentWeight.findMany({
      where: { courseId },
      include: INCLUDE,
      orderBy: [{ cpmkId: 'asc' }, { assessmentComponentId: 'asc' }],
    }) as Promise<WeightEntryMapped[]>;
  }

  async findByCurriculumId(curriculumId: string): Promise<WeightEntryMapped[]> {
    return this.prisma.courseCpmkAssessmentWeight.findMany({
      where: { cpmk: { curriculumId } },
      include: INCLUDE,
      orderBy: [{ courseId: 'asc' }, { cpmkId: 'asc' }, { assessmentComponentId: 'asc' }],
    }) as Promise<WeightEntryMapped[]>;
  }

  async bulkSave(courseId: string, weights: WeightEntryDto[]): Promise<number> {
    const nonZero = weights.filter((w) => w.weight > 0);
    await this.prisma.$transaction(async (tx) => {
      await tx.courseCpmkAssessmentWeight.deleteMany({ where: { courseId } });
      if (nonZero.length > 0) {
        await tx.courseCpmkAssessmentWeight.createMany({
          data: nonZero.map((w) => ({
            courseId,
            cpmkId: w.cpmkId,
            assessmentComponentId: w.assessmentComponentId,
            weight: w.weight,
          })),
        });
      }
    });
    return nonZero.length;
  }

  async deleteAllByCourse(courseId: string): Promise<number> {
    const result = await this.prisma.courseCpmkAssessmentWeight.deleteMany({ where: { courseId } });
    return result.count;
  }
}
