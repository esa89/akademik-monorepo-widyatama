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
import { CplService } from './cpl.service';
import { CreateCplDto } from './dto/create-cpl.dto';
import { UpdateCplDto } from './dto/update-cpl.dto';
import { QueryCplDto } from './dto/query-cpl.dto';
import { CplResponseDto } from './dto/cpl-response.dto';
import { CplCategory } from './enums/cpl-category.enum';

@ApiTags('CPL')
@ApiBearerAuth()
@Controller('cpl')
export class CplController {
  constructor(private readonly cplService: CplService) {}

  @Get()
  @ApiOperation({ summary: 'Get all CPLs with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of CPLs retrieved successfully',
    type: CplResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code, name, or description' })
  @ApiQuery({ name: 'category', required: false, enum: CplCategory, description: 'Filter by category' })
  @ApiQuery({ name: 'curriculumYear', required: false, type: Number, description: 'Filter by curriculum year' })
  @ApiQuery({ name: 'graduateProfileId', required: false, type: String, description: 'Filter by Graduate Profile ID' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (code, name, curriculumYear, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@Query() query: QueryCplDto) {
    return this.cplService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get CPL by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPL retrieved successfully',
    type: CplResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CPL not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.cplService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new CPL' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'CPL created successfully',
    type: CplResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'CPL code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async create(@Body() data: CreateCplDto) {
    return this.cplService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update CPL by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPL updated successfully',
    type: CplResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CPL not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'CPL code already exists',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateCplDto,
  ) {
    return this.cplService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete CPL by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPL deleted successfully',
    type: CplResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'CPL not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.cplService.remove(id);
  }
}
