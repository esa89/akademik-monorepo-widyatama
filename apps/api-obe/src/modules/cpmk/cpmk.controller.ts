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
import { CpmkService } from './cpmk.service';
import { CreateCpmkDto } from './dto/create-cpmk.dto';
import { UpdateCpmkDto } from './dto/update-cpmk.dto';
import { QueryCpmkDto } from './dto/query-cpmk.dto';
import { MapCplDto } from './dto/map-cpl.dto';
import { CpmkResponseDto, CpmkDetailResponseDto } from './dto/cpmk-response.dto';

@ApiTags('CPMK')
@ApiBearerAuth()
@Controller('cpmk')
export class CpmkController {
  constructor(private readonly service: CpmkService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all CPMK with pagination, search, and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of CPMK retrieved successfully',
    type: CpmkResponseDto,
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
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    description: 'Sort field (code, name, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort direction (asc, desc)',
  })
  async findAll(@Query() query: QueryCpmkDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CPMK by ID with CPL mappings' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPMK retrieved successfully',
    type: CpmkDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CPMK not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CPMK' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'CPMK created successfully',
    type: CpmkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'CPMK code already exists for this course',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async create(@Body() data: CreateCpmkDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update CPMK by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPMK updated successfully',
    type: CpmkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CPMK not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'CPMK code already exists for this course',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateCpmkDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete CPMK by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPMK deleted successfully',
    type: CpmkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CPMK not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/cpl')
  @ApiOperation({ summary: 'Map CPLs to CPMK with weights' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPLs mapped to CPMK successfully',
    type: CpmkDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CPMK or CPL not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Total weight exceeds 100 or duplicate mapping',
  })
  async mapCpl(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: MapCplDto,
  ) {
    return this.service.mapCpl(id, data);
  }
}
