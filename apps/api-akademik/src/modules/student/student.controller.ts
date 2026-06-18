import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';

@ApiTags('Students')
@ApiBearerAuth()
@Controller('students')
export class StudentController {
  constructor(private readonly service: StudentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all students with pagination, search, and filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of students retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by nim, name, email' })
  @ApiQuery({ name: 'facultyId', required: false, type: String })
  @ApiQuery({ name: 'studyProgramId', required: false, type: String })
  @ApiQuery({ name: 'curriculumId', required: false, type: String })
  @ApiQuery({ name: 'entryYear', required: false, type: Number })
  @ApiQuery({ name: 'studentStatus', required: false, type: String })
  @ApiQuery({ name: 'gender', required: false, type: String })
  @ApiQuery({ name: 'admissionPath', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(@Query() query: QueryStudentDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Student retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/transcript')
  @ApiOperation({ summary: 'Get student transcript: list mata kuliah, nilai, dan IPK' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Transcript retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  async getTranscript(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.getTranscript(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Student created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'NIM or Email already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  async create(@Body() data: CreateStudentDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update student by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Student updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateStudentDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete student by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Student deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Student not found' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
