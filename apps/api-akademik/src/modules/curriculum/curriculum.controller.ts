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
import { CurriculumService } from './curriculum.service';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { QueryCurriculumDto } from './dto/query-curriculum.dto';
import { CurriculumResponseDto } from './dto/curriculum-response.dto';

@ApiTags('Curriculums')
@ApiBearerAuth()
@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly service: CurriculumService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all Curriculums with pagination, search, and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Curriculums retrieved successfully',
    type: CurriculumResponseDto,
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
    name: 'studyProgramId',
    required: false,
    type: String,
    description: 'Filter by Study Program ID',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filter by effective year',
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
    description: 'Sort field (code, name, year, totalSemester, totalSks, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort direction (asc, desc)',
  })
  async findAll(@Query() query: QueryCurriculumDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Curriculum by ID with Study Program' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Curriculum retrieved successfully',
    type: CurriculumResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Curriculum not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Curriculum' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Curriculum created successfully',
    type: CurriculumResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Curriculum code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or Study Program not found',
  })
  async create(@Body() data: CreateCurriculumDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Curriculum by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Curriculum updated successfully',
    type: CurriculumResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Curriculum not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Curriculum code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Study Program not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateCurriculumDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Curriculum by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Curriculum deleted successfully',
    type: CurriculumResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Curriculum not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
