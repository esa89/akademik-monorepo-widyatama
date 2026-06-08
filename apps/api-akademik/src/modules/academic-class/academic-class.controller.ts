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
import { AcademicClassService } from './academic-class.service';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';
import { QueryAcademicClassDto } from './dto/query-academic-class.dto';

@ApiTags('Academic Classes')
@ApiBearerAuth()
@Controller('academic-classes')
export class AcademicClassController {
  constructor(private readonly service: AcademicClassService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Academic Classes with pagination, search, and filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of Academic Classes retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'semesterId', required: false, type: String })
  @ApiQuery({ name: 'courseId', required: false, type: String })
  @ApiQuery({ name: 'lecturerId', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'sortBy', required: false, type: String, enum: ['code', 'name', 'createdAt'] })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, enum: ['asc', 'desc'] })
  async findAll(@Query() query: QueryAcademicClassDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Academic Class by ID with full details' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Academic Class retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Academic Class not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Academic Class' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Academic Class created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Class code already exists in this semester' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error or referenced entity not found' })
  async create(@Body() data: CreateAcademicClassDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Academic Class by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Academic Class updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Academic Class not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Class code already exists in this semester' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error or referenced entity not found' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateAcademicClassDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Academic Class by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Academic Class deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Academic Class not found' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
