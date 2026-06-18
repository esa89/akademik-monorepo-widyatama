import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VisiMisiService } from './visi-misi.service';
import { CreateVisiMisiDto } from './dto/create-visi-misi.dto';
import { UpdateVisiMisiDto } from './dto/update-visi-misi.dto';
import { QueryVisiMisiDto } from './dto/query-visi-misi.dto';

@ApiTags('Visi & Misi')
@ApiBearerAuth()
@Controller('visi-misi')
export class VisiMisiController {
  constructor(private readonly service: VisiMisiService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Visi & Misi dengan pagination dan filter' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List retrieved successfully' })
  async findAll(@Query() query: QueryVisiMisiDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Visi/Misi by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Retrieved successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create Visi/Misi baru' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created successfully' })
  async create(@Body() data: CreateVisiMisiDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Visi/Misi by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Updated successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateVisiMisiDto,
  ) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Visi/Misi by ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Deleted successfully' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Not found' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
