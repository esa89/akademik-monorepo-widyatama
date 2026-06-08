import {
  Controller, Get, Post, Put, Delete, Body, Param,
  Query, HttpStatus, ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery,
} from '@nestjs/swagger';
import { LecturerService } from './lecturer.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { QueryLecturerDto } from './dto/query-lecturer.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Lecturers')
@ApiBearerAuth()
@Controller('lecturers')
export class LecturerController {
  constructor(private readonly service: LecturerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all lecturers with pagination, search, and filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of lecturers retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by nidn, nrk, name, email, username' })
  @ApiQuery({ name: 'facultyId', required: false, type: String })
  @ApiQuery({ name: 'studyProgramId', required: false, type: String })
  @ApiQuery({ name: 'lastEducation', required: false, type: String })
  @ApiQuery({ name: 'academicPosition', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'authentikStatus', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(@Query() query: QueryLecturerDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lecturer by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lecturer retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lecturer not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lecturer and Authentik account' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Lecturer created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'NIDN/NRK/Email/Username already exists' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  async create(@Body() data: CreateLecturerDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update lecturer by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lecturer updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lecturer not found' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateLecturerDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lecturer by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lecturer deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lecturer not found' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }

  @Post(':id/sync-authentik')
  @ApiOperation({ summary: 'Sync or re-create Authentik account for lecturer' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Synced to Authentik successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lecturer not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Sync failed' })
  async syncAuthentik(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.syncAuthentik(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Reset Authentik password for lecturer' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Lecturer not found' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Reset failed or Authentik account not created yet' })
  async resetPassword(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.service.resetPassword(id, dto);
  }
}
