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
import { StudyProgramService } from './study-program.service';
import { CreateStudyProgramDto } from './dto/create-study-program.dto';
import { UpdateStudyProgramDto } from './dto/update-study-program.dto';
import { QueryStudyProgramDto } from './dto/query-study-program.dto';
import { StudyProgramResponseDto } from './dto/study-program-response.dto';
import { Degree } from './enums/degree.enum';

@ApiTags('Study Programs')
@ApiBearerAuth()
@Controller('study-programs')
export class StudyProgramController {
  constructor(private readonly service: StudyProgramService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Study Programs with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Study Programs retrieved successfully',
    type: StudyProgramResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code or name' })
  @ApiQuery({ name: 'facultyId', required: false, type: String, description: 'Filter by Faculty ID' })
  @ApiQuery({ name: 'degree', required: false, enum: Degree, description: 'Filter by degree' })
  @ApiQuery({ name: 'accreditation', required: false, type: String, description: 'Filter by accreditation' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (code, name, degree, accreditation, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@Query() query: QueryStudyProgramDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Study Program by ID with Faculty' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Study Program retrieved successfully',
    type: StudyProgramResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Study Program not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Study Program' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Study Program created successfully',
    type: StudyProgramResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Study Program code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or Faculty not found',
  })
  async create(@Body() data: CreateStudyProgramDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Study Program by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Study Program updated successfully',
    type: StudyProgramResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Study Program not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Study Program code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Faculty not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateStudyProgramDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Study Program by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Study Program deleted successfully',
    type: StudyProgramResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Study Program not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
