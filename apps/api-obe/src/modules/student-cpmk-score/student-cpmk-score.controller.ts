import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentCpmkScoreService } from './student-cpmk-score.service';
import { BulkSaveStudentCpmkScoreDto } from './dto/bulk-save-student-cpmk-score.dto';

@ApiTags('Student CPMK Scores')
@ApiBearerAuth()
@Controller('student-cpmk-scores')
export class StudentCpmkScoreController {
  constructor(private readonly service: StudentCpmkScoreService) {}

  @Get()
  @ApiOperation({ summary: 'Get nilai CPMK mahasiswa (filter: classId wajib, opsional studentId)' })
  @ApiQuery({ name: 'classId', required: true })
  @ApiQuery({ name: 'studentId', required: false })
  findAll(
    @Query('classId') classId: string,
    @Query('studentId') studentId?: string,
  ) {
    if (studentId) {
      return this.service.findByClassAndStudent(classId, studentId);
    }
    return this.service.findByClass(classId);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Simpan semua nilai CPMK untuk suatu kelas (replace per kelas)' })
  bulkSave(@Body() dto: BulkSaveStudentCpmkScoreDto) {
    return this.service.bulkSave(dto);
  }

  @Delete('class/:classId')
  @ApiOperation({ summary: 'Hapus semua nilai CPMK untuk suatu kelas' })
  deleteByClass(@Param('classId') classId: string) {
    return this.service.deleteByClass(classId);
  }
}
