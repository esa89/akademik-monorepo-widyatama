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
import { RubricService } from './rubric.service';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubric.dto';
import { QueryRubricDto } from './dto/query-rubric.dto';
import { RubricResponseDto } from './dto/rubric-response.dto';

@ApiTags('Rubric')
@ApiBearerAuth()
@Controller('rubrics')
export class RubricController {
  constructor(private readonly service: RubricService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all Rubrics with pagination, search, and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Rubrics retrieved successfully',
    type: RubricResponseDto,
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
    name: 'assessmentId',
    required: false,
    type: String,
    description: 'Filter by Assessment ID',
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
  async findAll(@Query() query: QueryRubricDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Rubric by ID with Assessment, Sub CPMK and CPMK' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rubric retrieved successfully',
    type: RubricResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rubric not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Rubric' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rubric created successfully',
    type: RubricResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Rubric code already exists for this Assessment',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error, Assessment not found, or weight exceeds 100',
  })
  async create(@Body() data: CreateRubricDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Rubric by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rubric updated successfully',
    type: RubricResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rubric not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Rubric code already exists for this Assessment',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Assessment not found or weight exceeds 100',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateRubricDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Rubric by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rubric deleted successfully',
    type: RubricResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Rubric not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
