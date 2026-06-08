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
    include: {
      student: {
        select: {
          id: true,
          nim: true,
          name: true,
          gender: true,
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

    // Replace students if provided
    if (data.studentIds !== undefined) {
      updateData.students = {
        deleteMany: {},
        ...(data.studentIds.length > 0
          ? { create: data.studentIds.map((sid) => ({ studentId: sid })) }
          : {}),
      };
    }

    const item = await this.prisma.academicClass.update({
      where: { id },
      data: updateData,
      include: classDetailInclude,
    });
    return this.mapToDetailResponse(item);
  }

  async remove(id: string) {
    return this.prisma.academicClass.delete({ where: { id } });
  }

  async existsByCode(semesterId: string, code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.academicClass.count({
      where: {
        semesterId,
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
        student: s.student,
      })),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
