import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CourseCpmkWeightService } from './course-cpmk-weight.service';
import { BulkSaveCourseCpmkWeightDto } from './dto/bulk-save-course-cpmk-weight.dto';
import { QueryCourseCpmkWeightDto } from './dto/query-course-cpmk-weight.dto';

@ApiTags('Course CPMK Weights')
@ApiBearerAuth()
@Controller('course-cpmk-weights')
export class CourseCpmkWeightController {
  constructor(private readonly service: CourseCpmkWeightService) {}

  @Get()
  @ApiOperation({ summary: 'Get bobot penilaian CPMK (filter: courseId atau curriculumId)' })
  findAll(@Query() query: QueryCourseCpmkWeightDto) {
    return this.service.findAll(query);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Simpan semua bobot penilaian CPMK untuk suatu mata kuliah (replace)' })
  bulkSave(@Body() dto: BulkSaveCourseCpmkWeightDto) {
    return this.service.bulkSave(dto);
  }

  @Delete('course/:courseId')
  @ApiOperation({ summary: 'Hapus semua bobot untuk suatu mata kuliah' })
  deleteAllByCourse(@Param('courseId') courseId: string) {
    return this.service.deleteAllByCourse(courseId);
  }
}
