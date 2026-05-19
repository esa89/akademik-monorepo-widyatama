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
import { AssessmentService } from './assessment.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { QueryAssessmentDto } from './dto/query-assessment.dto';
import { AssessmentResponseDto } from './dto/assessment-response.dto';

@ApiTags('Assessment')
@ApiBearerAuth()
@Controller('assessments')
export class AssessmentController {
  constructor(private readonly service: AssessmentService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all Assessments with pagination, search, and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Assessments retrieved successfully',
    type: AssessmentResponseDto,
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
    name: 'subCpmkId',
    required: false,
    type: String,
    description: 'Filter by Sub CPMK ID',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    type: String,
    description: 'Filter by assessment type',
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
    description: 'Sort field (code, name, weight, maxScore, orderNumber, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort direction (asc, desc)',
  })
  async findAll(@Query() query: QueryAssessmentDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Assessment by ID with Sub CPMK, CPMK and Course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment retrieved successfully',
    type: AssessmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assessment not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Assessment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Assessment created successfully',
    type: AssessmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Assessment code already exists for this Sub CPMK',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error, Sub CPMK not found, or weight exceeds 100',
  })
  async create(@Body() data: CreateAssessmentDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Assessment by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment updated successfully',
    type: AssessmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assessment not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Assessment code already exists for this Sub CPMK',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Sub CPMK not found or weight exceeds 100',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateAssessmentDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Assessment by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Assessment deleted successfully',
    type: AssessmentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Assessment not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
