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
import { BodyOfKnowledgeService } from './body-of-knowledge.service';
import { CreateBodyOfKnowledgeDto } from './dto/create-body-of-knowledge.dto';
import { UpdateBodyOfKnowledgeDto } from './dto/update-body-of-knowledge.dto';
import { QueryBodyOfKnowledgeDto } from './dto/query-body-of-knowledge.dto';

@ApiTags('Body of Knowledge')
@ApiBearerAuth()
@Controller('body-of-knowledges')
export class BodyOfKnowledgeController {
  constructor(private readonly bodyOfKnowledgeService: BodyOfKnowledgeService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Body of Knowledges with pagination, search, and filters' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of Body of Knowledges retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 1000)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code, name, or reference' })
  @ApiQuery({ name: 'curriculumId', required: false, type: String, description: 'Filter by curriculum ID' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field (code, name, createdAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@Query() query: QueryBodyOfKnowledgeDto) {
    return this.bodyOfKnowledgeService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Body of Knowledge by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Body of Knowledge retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Body of Knowledge not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.bodyOfKnowledgeService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Body of Knowledge' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Body of Knowledge created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Code already exists in this curriculum' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Validation error' })
  async create(@Body() data: CreateBodyOfKnowledgeDto) {
    return this.bodyOfKnowledgeService.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Body of Knowledge by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Body of Knowledge updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Body of Knowledge not found' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Code already exists in this curriculum' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateBodyOfKnowledgeDto,
  ) {
    return this.bodyOfKnowledgeService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Body of Knowledge by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Body of Knowledge deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Body of Knowledge not found' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.bodyOfKnowledgeService.remove(id);
  }
}
