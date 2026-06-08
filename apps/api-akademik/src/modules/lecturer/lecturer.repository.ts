import { Injectable } from '@nestjs/common';
import { Prisma, AuthentikStatus } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { QueryLecturerDto } from './dto/query-lecturer.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface LecturerMapped {
  id: string;
  nidn: string;
  nrk: string;
  name: string;
  frontTitle: string | null;
  backTitle: string | null;
  email: string;
  phoneNumber: string | null;
  lastEducation: string;
  academicPosition: string;
  facultyId: string;
  studyProgramId: string;
  isActive: boolean;
  identityUserId: string | null;
  identityUsername: string | null;
  authentikStatus: string;
  faculty: { id: string; code: string; name: string } | null;
  studyProgram: { id: string; code: string; name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const lecturerInclude = {
  faculty: { select: { id: true, code: true, name: true } },
  studyProgram: { select: { id: true, code: true, name: true } },
} satisfies Prisma.LecturerInclude;

@Injectable()
export class LecturerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryLecturerDto): Promise<PaginatedResult<LecturerMapped>> {
    const {
      page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc',
      search, facultyId, studyProgramId, lastEducation, academicPosition,
      isActive, authentikStatus,
    } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.LecturerWhereInput = {};
    if (search) {
      where.OR = [
        { nidn: { contains: search, mode: 'insensitive' } },
        { nrk: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { identityUsername: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (facultyId) where.facultyId = facultyId;
    if (studyProgramId) where.studyProgramId = studyProgramId;
    if (lastEducation) where.lastEducation = lastEducation;
    if (academicPosition) where.academicPosition = academicPosition;
    if (isActive !== undefined) where.isActive = isActive;
    if (authentikStatus) where.authentikStatus = authentikStatus;

    const [data, total] = await Promise.all([
      this.prisma.lecturer.findMany({
        where, skip, take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: lecturerInclude,
      }),
      this.prisma.lecturer.count({ where }),
    ]);

    return createPaginatedResult(data.map((i) => this.mapToResponse(i)), total, page, limit);
  }

  async findById(id: string): Promise<LecturerMapped | null> {
    const item = await this.prisma.lecturer.findUnique({
      where: { id },
      include: lecturerInclude,
    });
    return item ? this.mapToResponse(item) : null;
  }

  async findByNidn(nidn: string) {
    return this.prisma.lecturer.findUnique({ where: { nidn } });
  }

  async findByNrk(nrk: string) {
    return this.prisma.lecturer.findUnique({ where: { nrk } });
  }

  async findByEmail(email: string) {
    return this.prisma.lecturer.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.lecturer.findUnique({ where: { identityUsername: username } });
  }

  async create(data: CreateLecturerDto) {
    return this.prisma.lecturer.create({
      data: {
        nidn: data.nidn,
        nrk: data.nrk,
        name: data.name,
        frontTitle: data.frontTitle ?? null,
        backTitle: data.backTitle ?? null,
        email: data.email,
        phoneNumber: data.phoneNumber ?? null,
        lastEducation: data.lastEducation,
        academicPosition: data.academicPosition ?? 'TENAGA_PENGAJAR',
        facultyId: data.facultyId,
        studyProgramId: data.studyProgramId,
        isActive: data.isActive ?? true,
        identityUsername: data.username,
        authentikStatus: 'NOT_SYNCED',
      },
      include: lecturerInclude,
    });
  }

  async update(id: string, data: UpdateLecturerDto) {
    const updateData: Prisma.LecturerUpdateInput = {};
    if (data.nidn !== undefined) updateData.nidn = data.nidn;
    if (data.nrk !== undefined) updateData.nrk = data.nrk;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.frontTitle !== undefined) updateData.frontTitle = data.frontTitle;
    if (data.backTitle !== undefined) updateData.backTitle = data.backTitle;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
    if (data.lastEducation !== undefined) updateData.lastEducation = data.lastEducation;
    if (data.academicPosition !== undefined) updateData.academicPosition = data.academicPosition;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.facultyId !== undefined) updateData.faculty = { connect: { id: data.facultyId } };
    if (data.studyProgramId !== undefined) updateData.studyProgram = { connect: { id: data.studyProgramId } };

    return this.prisma.lecturer.update({
      where: { id },
      data: updateData,
      include: lecturerInclude,
    });
  }

  async updateAuthentikInfo(
    id: string,
    info: { identityUserId: string; authentikStatus: AuthentikStatus },
  ) {
    return this.prisma.lecturer.update({
      where: { id },
      data: {
        identityUserId: info.identityUserId,
        authentikStatus: info.authentikStatus,
      },
    });
  }

  async updateAuthentikStatus(id: string, authentikStatus: AuthentikStatus) {
    return this.prisma.lecturer.update({ where: { id }, data: { authentikStatus } });
  }

  async remove(id: string) {
    return this.prisma.lecturer.delete({ where: { id } });
  }

  async existsByNidn(nidn: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.lecturer.count({
      where: { nidn, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async existsByNrk(nrk: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.lecturer.count({
      where: { nrk, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.lecturer.count({
      where: { email, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async existsByUsername(username: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.lecturer.count({
      where: { identityUsername: username, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    return count > 0;
  }

  async facultyExists(id: string): Promise<boolean> {
    const count = await this.prisma.faculty.count({ where: { id } });
    return count > 0;
  }

  async studyProgramExists(id: string): Promise<boolean> {
    const count = await this.prisma.studyProgram.count({ where: { id } });
    return count > 0;
  }

  mapToResponse(item: {
    id: string; nidn: string; nrk: string; name: string;
    frontTitle: string | null; backTitle: string | null;
    email: string; phoneNumber: string | null;
    lastEducation: string; academicPosition: string;
    facultyId: string; studyProgramId: string; isActive: boolean;
    identityUserId: string | null; identityUsername: string | null;
    authentikStatus: string;
    faculty: { id: string; code: string; name: string } | null;
    studyProgram: { id: string; code: string; name: string } | null;
    createdAt: Date; updatedAt: Date;
  }): LecturerMapped {
    return {
      id: item.id,
      nidn: item.nidn,
      nrk: item.nrk,
      name: item.name,
      frontTitle: item.frontTitle,
      backTitle: item.backTitle,
      email: item.email,
      phoneNumber: item.phoneNumber,
      lastEducation: item.lastEducation,
      academicPosition: item.academicPosition,
      facultyId: item.facultyId,
      studyProgramId: item.studyProgramId,
      isActive: item.isActive,
      identityUserId: item.identityUserId,
      identityUsername: item.identityUsername,
      authentikStatus: item.authentikStatus,
      faculty: item.faculty,
      studyProgram: item.studyProgram,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
