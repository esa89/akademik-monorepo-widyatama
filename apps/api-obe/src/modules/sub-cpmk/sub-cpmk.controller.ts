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
import { SubCpmkService } from './sub-cpmk.service';
import { CreateSubCpmkDto } from './dto/create-sub-cpmk.dto';
import { UpdateSubCpmkDto } from './dto/update-sub-cpmk.dto';
import { QuerySubCpmkDto } from './dto/query-sub-cpmk.dto';
import { SubCpmkResponseDto } from './dto/sub-cpmk-response.dto';

@ApiTags('Sub CPMK')
@ApiBearerAuth()
@Controller('sub-cpmk')
export class SubCpmkController {
  constructor(private readonly service: SubCpmkService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all Sub CPMK with pagination, search, and filters',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Sub CPMK retrieved successfully',
    type: SubCpmkResponseDto,
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
    name: 'cpmkId',
    required: false,
    type: String,
    description: 'Filter by CPMK ID',
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
    description: 'Sort field (code, name, orderNumber, targetPercentage, createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    type: String,
    description: 'Sort direction (asc, desc)',
  })
  async findAll(@Query() query: QuerySubCpmkDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Sub CPMK by ID with CPMK and Course' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sub CPMK retrieved successfully',
    type: SubCpmkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sub CPMK not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Sub CPMK' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Sub CPMK created successfully',
    type: SubCpmkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Sub CPMK code already exists for this CPMK',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or CPMK not found',
  })
  async create(@Body() data: CreateSubCpmkDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Sub CPMK by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sub CPMK updated successfully',
    type: SubCpmkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sub CPMK not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Sub CPMK code already exists for this CPMK',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'CPMK not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateSubCpmkDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Sub CPMK by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sub CPMK deleted successfully',
    type: SubCpmkResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Sub CPMK not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
