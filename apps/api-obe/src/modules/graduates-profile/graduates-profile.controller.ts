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
import { GraduatesProfileService } from './graduates-profile.service';
import { CreateGraduateProfileDto } from './dto/create-graduate-profile.dto';
import { UpdateGraduateProfileDto } from './dto/update-graduate-profile.dto';
import { QueryGraduateProfileDto } from './dto/query-graduate-profile.dto';
import { GraduateProfileResponseDto } from './dto/graduate-profile-response.dto';

@ApiTags('Graduate Profiles')
@ApiBearerAuth()
@Controller('graduate-profiles')
export class GraduatesProfileController {
  constructor(private readonly service: GraduatesProfileService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Graduate Profiles with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Graduate Profiles retrieved successfully',
    type: GraduateProfileResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code, name, or description' })
  @ApiQuery({ name: 'curriculumYear', required: false, type: Number, description: 'Filter by curriculum year' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (code, name, curriculumYear, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@Query() query: QueryGraduateProfileDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Graduate Profile by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Graduate Profile retrieved successfully',
    type: GraduateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Graduate Profile not found',
  })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Graduate Profile' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Graduate Profile created successfully',
    type: GraduateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Graduate Profile code already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async create(@Body() data: CreateGraduateProfileDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Graduate Profile by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Graduate Profile updated successfully',
    type: GraduateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Graduate Profile not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Graduate Profile code already exists',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateGraduateProfileDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Graduate Profile by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Graduate Profile deleted successfully',
    type: GraduateProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Graduate Profile not found',
  })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
