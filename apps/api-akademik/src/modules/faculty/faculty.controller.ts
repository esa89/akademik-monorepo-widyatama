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
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { QueryFacultyDto } from './dto/query-faculty.dto';
import { FacultyResponseDto } from './dto/faculty-response.dto';

@ApiTags('Faculties')
@ApiBearerAuth()
@Controller('faculties')
export class FacultyController {
  constructor(private readonly service: FacultyService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Faculties with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Faculties retrieved successfully',
    type: FacultyResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code or name' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (code, name, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@Query() query: QueryFacultyDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Faculty by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Faculty retrieved successfully',
    type: FacultyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Faculty not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Faculty' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Faculty created successfully',
    type: FacultyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Faculty code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async create(@Body() data: CreateFacultyDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Faculty by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Faculty updated successfully',
    type: FacultyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Faculty not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Faculty code already exists',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateFacultyDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Faculty by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Faculty deleted successfully',
    type: FacultyResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Faculty not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
