import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { ScoreEntryDto } from './dto/bulk-save-student-cpmk-score.dto';

const scoreInclude = {
  cpmk: { select: { id: true, code: true, name: true } },
  assessmentComponent: { select: { id: true, code: true, name: true } },
} as const;

@Injectable()
export class StudentCpmkScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByClass(classId: string) {
    return this.prisma.studentCpmkScore.findMany({
      where: { classId },
      include: scoreInclude,
    });
  }

  async findByClassAndStudent(classId: string, studentId: string) {
    return this.prisma.studentCpmkScore.findMany({
      where: { classId, studentId },
      include: scoreInclude,
    });
  }

  async bulkSave(classId: string, courseId: string, scores: ScoreEntryDto[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.studentCpmkScore.deleteMany({ where: { classId } });
      if (scores.length === 0) return 0;
      const result = await tx.studentCpmkScore.createMany({
        data: scores.map((s) => ({
          classId,
          courseId,
          studentId: s.studentId,
          cpmkId: s.cpmkId,
          assessmentComponentId: s.assessmentComponentId,
          score: s.score,
        })),
      });
      return result.count;
    });
  }

  async deleteByClass(classId: string) {
    const result = await this.prisma.studentCpmkScore.deleteMany({ where: { classId } });
    return result.count;
  }
}
