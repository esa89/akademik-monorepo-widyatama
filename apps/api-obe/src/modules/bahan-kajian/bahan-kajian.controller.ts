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
import { BahanKajianService } from './bahan-kajian.service';
import { CreateBahanKajianDto } from './dto/create-bahan-kajian.dto';
import { UpdateBahanKajianDto } from './dto/update-bahan-kajian.dto';
import { QueryBahanKajianDto } from './dto/query-bahan-kajian.dto';
import { MapCplBahanKajianDto } from './dto/map-cpl-bahan-kajian.dto';
import { BahanKajianResponseDto, BahanKajianDetailResponseDto } from './dto/bahan-kajian-response.dto';

@ApiTags('Bahan Kajian')
@ApiBearerAuth()
@Controller('bahan-kajian')
export class BahanKajianController {
  constructor(private readonly service: BahanKajianService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Bahan Kajian with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Bahan Kajian retrieved successfully',
    type: BahanKajianResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code, name, or description' })
  @ApiQuery({ name: 'curriculumYear', required: false, type: Number, description: 'Filter by curriculum year' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (code, name, curriculumYear, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@Query() query: QueryBahanKajianDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Bahan Kajian by ID with related CPLs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bahan Kajian retrieved successfully with related CPLs',
    type: BahanKajianDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bahan Kajian not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Bahan Kajian' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bahan Kajian created successfully',
    type: BahanKajianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Bahan Kajian code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async create(@Body() data: CreateBahanKajianDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Bahan Kajian by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bahan Kajian updated successfully',
    type: BahanKajianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bahan Kajian not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Bahan Kajian code already exists',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateBahanKajianDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Bahan Kajian by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bahan Kajian deleted successfully',
    type: BahanKajianResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bahan Kajian not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/cpl')
  @ApiOperation({ summary: 'Map CPLs to Bahan Kajian' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'CPLs mapped successfully',
    type: BahanKajianDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Bahan Kajian or CPL not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Some CPLs are already mapped',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async mapCpl(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: MapCplBahanKajianDto,
  ) {
    return this.service.mapCplToBahanKajian(id, dto);
  }
}
