import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface StudentMapped {
  id: string;
  nim: string;
  name: string;
  birthPlace: string | null;
  birthDate: Date | null;
  gender: string;
  agama: string | null;
  email: string | null;
  phoneNumber: string | null;
  facultyId: string;
  studyProgramId: string;
  curriculumId: string | null;
  academicSemesterId: string | null;
  admissionPath: string;
  entryYear: number;
  studentStatus: string;
  isActive: boolean;
  faculty: { id: string; code: string; name: string } | null;
  studyProgram: { id: string; code: string; name: string } | null;
  curriculum: { id: string; code: string; name: string; year: number } | null;
  academicSemester: { id: string; code: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const studentInclude = {
  faculty:          { select: { id: true, code: true, name: true } },
  studyProgram:     { select: { id: true, code: true, name: true } },
  curriculum:       { select: { id: true, code: true, name: true, year: true } },
  academicSemester: { select: { id: true, code: true, name: true } },
} satisfies Prisma.StudentInclude;

@Injectable()
export class StudentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryStudentDto): Promise<PaginatedResult<StudentMapped>> {
    const {
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc',
      search, facultyId, studyProgramId, curriculumId, entryYear,
      studentStatus, gender, admissionPath, isActive,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.StudentWhereInput = {};
    if (search) {
      where.OR = [
        { nim:   { contains: search, mode: 'insensitive' } },
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (facultyId)      where.facultyId = facultyId;
    if (studyProgramId) where.studyProgramId = studyProgramId;
    if (curriculumId)   where.curriculumId = curriculumId;
    if (entryYear)      where.entryYear = entryYear;
    if (studentStatus)  where.studentStatus = studentStatus;
    if (gender)         where.gender = gender;
    if (admissionPath)  where.admissionPath = admissionPath;
    if (isActive !== undefined) where.isActive = isActive;

    const [data, total] = await Promise.all([
      this.prisma.student.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: studentInclude,
      }),
      this.prisma.student.count({ where }),
    ]);

    return createPaginatedResult(data.map((i) => this.mapToResponse(i)), total, page, limit);
  }

  async findById(id: string): Promise<StudentMapped | null> {
    const item = await this.prisma.student.findUnique({
      where: { id },
      include: studentInclude,
    });
    return item ? this.mapToResponse(item) : null;
  }

  async create(data: CreateStudentDto) {
    return this.prisma.student.create({
      data: {
        nim:               data.nim,
        name:              data.name,
        birthPlace:        data.birthPlace ?? null,
        birthDate:         data.birthDate ? new Date(data.birthDate) : null,
        gender:            data.gender,
        agama:             data.agama ?? null,
        email:             data.email ?? null,
        phoneNumber:       data.phoneNumber ?? null,
        facultyId:         data.facultyId,
        studyProgramId:    data.studyProgramId,
        curriculumId:      data.curriculumId ?? null,
        academicSemesterId: data.academicSemesterId ?? null,
        entryYear:         data.entryYear,
        admissionPath:     data.admissionPath ?? 'REGULER',
        studentStatus:     data.studentStatus ?? 'AKTIF',
        isActive:          data.isActive ?? true,
      },
      include: studentInclude,
    });
  }

  async update(id: string, data: UpdateStudentDto) {
    const u: Prisma.StudentUpdateInput = {};
    if (data.nim !== undefined)           u.nim = data.nim;
    if (data.name !== undefined)          u.name = data.name;
    if (data.birthPlace !== undefined)    u.birthPlace = data.birthPlace;
    if (data.birthDate !== undefined)     u.birthDate = data.birthDate ? new Date(data.birthDate) : null;
    if (data.gender !== undefined)        u.gender = data.gender;
    if (data.agama !== undefined)         u.agama = data.agama;
    if (data.email !== undefined)         u.email = data.email;
    if (data.phoneNumber !== undefined)   u.phoneNumber = data.phoneNumber;
    if (data.entryYear !== undefined)     u.entryYear = data.entryYear;
    if (data.admissionPath !== undefined) u.admissionPath = data.admissionPath;
    if (data.studentStatus !== undefined) u.studentStatus = data.studentStatus;
    if (data.isActive !== undefined)      u.isActive = data.isActive;
    if (data.facultyId !== undefined)         u.faculty         = { connect: { id: data.facultyId } };
    if (data.studyProgramId !== undefined)    u.studyProgram    = { connect: { id: data.studyProgramId } };
    if (data.curriculumId !== undefined)      u.curriculum      = data.curriculumId ? { connect: { id: data.curriculumId } } : { disconnect: true };
    if (data.academicSemesterId !== undefined) u.academicSemester = data.academicSemesterId ? { connect: { id: data.academicSemesterId } } : { disconnect: true };

    return this.prisma.student.update({ where: { id }, data: u, include: studentInclude });
  }

  async remove(id: string) {
    return this.prisma.student.delete({ where: { id } });
  }

  async existsByNim(nim: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.student.count({
      where: { nim, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.student.count({
      where: { email, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async facultyExists(id: string)         { return !!(await this.prisma.faculty.count({ where: { id } })); }
  async studyProgramExists(id: string)    { return !!(await this.prisma.studyProgram.count({ where: { id } })); }
  async curriculumExists(id: string)      { return !!(await this.prisma.curriculum.count({ where: { id } })); }
  async academicSemesterExists(id: string){ return !!(await this.prisma.academicSemester.count({ where: { id } })); }

  mapToResponse(item: {
    id: string; nim: string; name: string; birthPlace: string | null;
    birthDate: Date | null; gender: string; agama: string | null; email: string | null;
    phoneNumber: string | null; facultyId: string; studyProgramId: string;
    curriculumId: string | null; academicSemesterId: string | null;
    admissionPath: string; entryYear: number; studentStatus: string;
    isActive: boolean; createdAt: Date; updatedAt: Date;
    faculty: { id: string; code: string; name: string } | null;
    studyProgram: { id: string; code: string; name: string } | null;
    curriculum: { id: string; code: string; name: string; year: number } | null;
    academicSemester: { id: string; code: string; name: string } | null;
  }): StudentMapped {
    return {
      id: item.id, nim: item.nim, name: item.name,
      birthPlace: item.birthPlace, birthDate: item.birthDate,
      gender: item.gender, agama: item.agama, email: item.email, phoneNumber: item.phoneNumber,
      facultyId: item.facultyId, studyProgramId: item.studyProgramId,
      curriculumId: item.curriculumId, academicSemesterId: item.academicSemesterId,
      admissionPath: item.admissionPath, entryYear: item.entryYear,
      studentStatus: item.studentStatus, isActive: item.isActive,
      faculty: item.faculty, studyProgram: item.studyProgram,
      curriculum: item.curriculum, academicSemester: item.academicSemester,
      createdAt: item.createdAt, updatedAt: item.updatedAt,
    };
  }
}
