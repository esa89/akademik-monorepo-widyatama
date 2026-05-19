import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all Courses with pagination, search, and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Courses retrieved successfully',
    type: CourseResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (max 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by code or name',
  })
  @ApiQuery({
    name: 'curriculumId',
    required: false,
    type: String,
    description: 'Filter by Curriculum ID',
  })
  @ApiQuery({
    name: 'semester',
    required: false,
    type: Number,
    description: 'Filter by semester',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (code, name, semester, sks, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort direction (asc, desc)',
  })
  async findAll(@Query() query: QueryCourseDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Course by ID with Curriculum and Study Program' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course retrieved successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Course' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Course code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or Curriculum not found',
  })
  async create(@Body() data: CreateCourseDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Course code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Curriculum not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateCourseDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course deleted successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
