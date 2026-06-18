import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AssessmentComponentService } from './assessment-component.service';
import { CreateAssessmentComponentDto } from './dto/create-assessment-component.dto';
import { UpdateAssessmentComponentDto } from './dto/update-assessment-component.dto';
import { QueryAssessmentComponentDto } from './dto/query-assessment-component.dto';

@ApiTags('Assessment Components')
@ApiBearerAuth()
@Controller('assessment-components')
export class AssessmentComponentController {
  constructor(private readonly service: AssessmentComponentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all komponen penilaian dengan pagination dan filter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil mengambil data' })
  findAll(@Query() query: QueryAssessmentComponentDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get komponen penilaian by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tidak ditemukan' })
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Buat komponen penilaian baru' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Berhasil dibuat' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Kode sudah digunakan' })
  create(@Body() data: CreateAssessmentComponentDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update komponen penilaian' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil diperbarui' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tidak ditemukan' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Kode sudah digunakan' })
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateAssessmentComponentDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus komponen penilaian' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Berhasil dihapus' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tidak ditemukan' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
