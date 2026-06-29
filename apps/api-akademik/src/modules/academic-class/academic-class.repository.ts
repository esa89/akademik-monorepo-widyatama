import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';
import { QueryAcademicClassDto } from './dto/query-academic-class.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface AcademicClassLecturerMapped {
  id: string;
  classId: string;
  lecturerId: string;
  role: string;
  lecturer: {
    id: string;
    nidn: string;
    name: string;
    frontTitle: string | null;
    backTitle: string | null;
  } | null;
}

export interface AcademicClassStudentMapped {
  id: string;
  classId: string;
  studentId: string;
  kehadiran: number | null;
  uts: number | null;
  uas: number | null;
  quiz: number | null;
  tugas: number | null;
  nilaiAkhir: number | null;
  grade: string | null;
  student: {
    id: string;
    nim: string;
    name: string;
    gender: string;
    studyProgram: { id: string; code: string; name: string } | null;
  } | null;
}

export interface AcademicClassMapped {
  id: string;
  semesterId: string;
  courseId: string;
  code: string;
  name: string;
  capacity: number;
  isActive: boolean;
  semester: { id: string; code: string; name: string; academicYear: string; semesterType: string } | null;
  course: { id: string; code: string; name: string; sks: number } | null;
  lecturers: AcademicClassLecturerMapped[];
  totalStudents: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AcademicClassDetailMapped extends AcademicClassMapped {
  students: AcademicClassStudentMapped[];
}

const classListInclude = {
  semester: {
    select: { id: true, code: true, name: true, academicYear: true, semesterType: true },
  },
  course: {
    select: { id: true, code: true, name: true, sks: true },
  },
  lecturers: {
    include: {
      lecturer: {
        select: { id: true, nidn: true, name: true, frontTitle: true, backTitle: true },
      },
    },
    orderBy: { role: 'asc' as const },
  },
  _count: {
    select: { students: true },
  },
} satisfies Prisma.AcademicClassInclude;

const classDetailInclude = {
  semester: {
    select: { id: true, code: true, name: true, academicYear: true, semesterType: true },
  },
  course: {
    select: { id: true, code: true, name: true, sks: true },
  },
  lecturers: {
    include: {
      lecturer: {
        select: { id: true, nidn: true, name: true, frontTitle: true, backTitle: true },
      },
    },
    orderBy: { role: 'asc' as const },
  },
  students: {
    select: {
      id: true,
      classId: true,
      studentId: true,
      kehadiran: true,
      uts: true,
      uas: true,
      quiz: true,
      tugas: true,
      nilaiAkhir: true,
      grade: true,
      student: {
        select: {
          id: true,
          nim: true,
          name: true,
          gender: true,
          entryYear: true,
          studyProgram: { select: { id: true, code: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'asc' as const },
  },
  _count: {
    select: { students: true },
  },
} satisfies Prisma.AcademicClassInclude;

@Injectable()
export class AcademicClassRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryAcademicClassDto): Promise<PaginatedResult<AcademicClassMapped>> {
    const {
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc',
      search, semesterId, courseId, lecturerId, isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AcademicClassWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { course: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (semesterId) where.semesterId = semesterId;
    if (courseId) where.courseId = courseId;
    if (lecturerId) {
      where.lecturers = { some: { lecturerId } };
    }
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.academicClass.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: classListInclude,
      }),
      this.prisma.academicClass.count({ where }),
    ]);

    return createPaginatedResult(
      data.map((item) => this.mapToListResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findById(id: string): Promise<AcademicClassDetailMapped | null> {
    const item = await this.prisma.academicClass.findUnique({
      where: { id },
      include: classDetailInclude,
    });
    return item ? this.mapToDetailResponse(item) : null;
  }

  async create(data: CreateAcademicClassDto): Promise<AcademicClassDetailMapped> {
    const item = await this.prisma.academicClass.create({
      data: {
        semesterId: data.semesterId,
        courseId: data.courseId,
        code: data.code,
        name: data.name,
        capacity: data.capacity ?? 40,
        isActive: data.isActive ?? true,
        lecturers: {
          create: data.lecturers.map((l) => ({
            lecturerId: l.lecturerId,
            role: l.role,
          })),
        },
        ...(data.studentIds && data.studentIds.length > 0
          ? {
              students: {
                create: data.studentIds.map((sid) => ({ studentId: sid })),
              },
            }
          : {}),
      },
      include: classDetailInclude,
    });
    return this.mapToDetailResponse(item);
  }

  async update(id: string, data: UpdateAcademicClassDto): Promise<AcademicClassDetailMapped> {
    const updateData: Prisma.AcademicClassUpdateInput = {};

    if (data.semesterId !== undefined) updateData.semester = { connect: { id: data.semesterId } };
    if (data.courseId !== undefined) updateData.course = { connect: { id: data.courseId } };
    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    // Replace lecturers if provided
    if (data.lecturers !== undefined && data.lecturers.length > 0) {
      updateData.lecturers = {
        deleteMany: {},
        create: data.lecturers.map((l) => ({
          lecturerId: l.lecturerId,
          role: l.role,
        })),
      };
    }

    // Sync students: remove those not in new list, add new ones (preserving grades for existing)
    if (data.studentIds !== undefined) {
      if (data.studentIds.length === 0) {
        updateData.students = { deleteMany: {} };
      } else {
        const existing = await this.prisma.classStudent.findMany({
          where: { classId: id },
          select: { studentId: true },
        });
        const existingIds = new Set(existing.map((s) => s.studentId));
        const newIds = new Set(data.studentIds);

        const toRemove = [...existingIds].filter((sid) => !newIds.has(sid));
        const toAdd = [...newIds].filter((sid) => !existingIds.has(sid));

        if (toRemove.length > 0) {
          await this.prisma.classStudent.deleteMany({
            where: { classId: id, studentId: { in: toRemove } },
          });
        }
        if (toAdd.length > 0) {
          await this.prisma.classStudent.createMany({
            data: toAdd.map((sid) => ({ classId: id, studentId: sid })),
          });
        }
      }
    }

    const item = await this.prisma.academicClass.update({
      where: { id },
      data: updateData,
      include: classDetailInclude,
    });
    return this.mapToDetailResponse(item);
  }

  async bulkUpsertGrades(
    classId: string,
    grades: Array<{
      nim: string;
      kehadiran?: number;
      uts?: number;
      uas?: number;
      quiz?: number;
      tugas?: number;
      nilaiAkhir?: number;
      grade?: string;
    }>,
  ): Promise<{ updated: number; notFound: string[] }> {
    const students = await this.prisma.classStudent.findMany({
      where: { classId },
      include: { student: { select: { nim: true } } },
    });

    const nimToRecord = new Map(students.map((s) => [s.student?.nim ?? '', s]));
    const notFound: string[] = [];
    let updated = 0;

    for (const g of grades) {
      const record = nimToRecord.get(g.nim);
      if (!record) { notFound.push(g.nim); continue; }

      // Nilai akhir: gunakan yang diinput manual, atau hitung dari komponen jika ada komponen baru
      const mergedKehadiran = g.kehadiran ?? record.kehadiran ?? undefined;
      const mergedTugas     = g.tugas    ?? record.tugas    ?? undefined;
      const mergedQuiz      = g.quiz     ?? record.quiz     ?? undefined;
      const mergedUts       = g.uts      ?? record.uts      ?? undefined;
      const mergedUas       = g.uas      ?? record.uas      ?? undefined;

      const computedNA = this.computeNilaiAkhir(mergedKehadiran, mergedTugas, mergedQuiz, mergedUts, mergedUas);
      const finalNA    = g.nilaiAkhir !== undefined ? g.nilaiAkhir : (computedNA ?? record.nilaiAkhir ?? null);

      // Grade: selalu dari input dosen — tidak pernah dihitung otomatis
      const finalGrade = g.grade !== undefined ? g.grade : record.grade;

      await this.prisma.classStudent.update({
        where: { id: record.id },
        data: {
          kehadiran:  g.kehadiran  !== undefined ? g.kehadiran  : record.kehadiran,
          uts:        g.uts        !== undefined ? g.uts        : record.uts,
          uas:        g.uas        !== undefined ? g.uas        : record.uas,
          quiz:       g.quiz       !== undefined ? g.quiz       : record.quiz,
          tugas:      g.tugas      !== undefined ? g.tugas      : record.tugas,
          nilaiAkhir: finalNA,
          grade:      finalGrade,
        },
      });
      updated++;
    }

    return { updated, notFound };
  }

  computeNilaiAkhir(
    kehadiran?: number,
    tugas?: number,
    quiz?: number,
    uts?: number,
    uas?: number,
  ): number | null {
    if ([kehadiran, tugas, quiz, uts, uas].every((v) => v === undefined)) return null;
    return (
      (kehadiran ?? 0) * 0.10 +
      (tugas     ?? 0) * 0.20 +
      (quiz      ?? 0) * 0.20 +
      (uts       ?? 0) * 0.20 +
      (uas       ?? 0) * 0.30
    );
  }

  async remove(id: string) {
    return this.prisma.academicClass.delete({ where: { id } });
  }

  async existsByCode(semesterId: string, courseId: string, code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.academicClass.count({
      where: {
        semesterId,
        courseId,
        code,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async semesterExists(id: string): Promise<boolean> {
    const count = await this.prisma.academicSemester.count({ where: { id } });
    return count > 0;
  }

  async courseExists(id: string): Promise<boolean> {
    const count = await this.prisma.course.count({ where: { id } });
    return count > 0;
  }

  async lecturerExists(id: string): Promise<boolean> {
    const count = await this.prisma.lecturer.count({ where: { id } });
    return count > 0;
  }

  async studentExists(id: string): Promise<boolean> {
    const count = await this.prisma.student.count({ where: { id } });
    return count > 0;
  }

  async getStudentCount(classId: string): Promise<number> {
    return this.prisma.classStudent.count({ where: { classId } });
  }

  private mapToListResponse(item: {
    id: string;
    semesterId: string;
    courseId: string;
    code: string;
    name: string;
    capacity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    semester: { id: string; code: string; name: string; academicYear: string; semesterType: string } | null;
    course: { id: string; code: string; name: string; sks: number } | null;
    lecturers: Array<{
      id: string;
      classId: string;
      lecturerId: string;
      role: string;
      lecturer: { id: string; nidn: string; name: string; frontTitle: string | null; backTitle: string | null } | null;
    }>;
    _count: { students: number };
  }): AcademicClassMapped {
    return {
      id: item.id,
      semesterId: item.semesterId,
      courseId: item.courseId,
      code: item.code,
      name: item.name,
      capacity: item.capacity,
      isActive: item.isActive,
      semester: item.semester,
      course: item.course,
      lecturers: item.lecturers.map((l) => ({
        id: l.id,
        classId: l.classId,
        lecturerId: l.lecturerId,
        role: l.role,
        lecturer: l.lecturer,
      })),
      totalStudents: item._count.students,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  private mapToDetailResponse(item: {
    id: string;
    semesterId: string;
    courseId: string;
    code: string;
    name: string;
    capacity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    semester: { id: string; code: string; name: string; academicYear: string; semesterType: string } | null;
    course: { id: string; code: string; name: string; sks: number } | null;
    lecturers: Array<{
      id: string;
      classId: string;
      lecturerId: string;
      role: string;
      lecturer: { id: string; nidn: string; name: string; frontTitle: string | null; backTitle: string | null } | null;
    }>;
    students: Array<{
      id: string;
      classId: string;
      studentId: string;
      kehadiran: number | null;
      uts: number | null;
      uas: number | null;
      quiz: number | null;
      tugas: number | null;
      nilaiAkhir: number | null;
      grade: string | null;
      student: {
        id: string;
        nim: string;
        name: string;
        gender: string;
        studyProgram: { id: string; code: string; name: string } | null;
      } | null;
    }>;
    _count: { students: number };
  }): AcademicClassDetailMapped {
    return {
      id: item.id,
      semesterId: item.semesterId,
      courseId: item.courseId,
      code: item.code,
      name: item.name,
      capacity: item.capacity,
      isActive: item.isActive,
      semester: item.semester,
      course: item.course,
      lecturers: item.lecturers.map((l) => ({
        id: l.id,
        classId: l.classId,
        lecturerId: l.lecturerId,
        role: l.role,
        lecturer: l.lecturer,
      })),
      totalStudents: item._count.students,
      students: item.students.map((s) => ({
        id: s.id,
        classId: s.classId,
        studentId: s.studentId,
        kehadiran: s.kehadiran,
        uts: s.uts,
        uas: s.uas,
        quiz: s.quiz,
        tugas: s.tugas,
        nilaiAkhir: s.nilaiAkhir,
        grade: s.grade,
        student: s.student,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
