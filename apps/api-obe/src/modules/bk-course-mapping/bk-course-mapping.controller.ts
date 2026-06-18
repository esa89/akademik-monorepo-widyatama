import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BkCourseMappingService } from './bk-course-mapping.service';
import { SaveBkCourseMappingsDto } from './dto/save-bk-course-mappings.dto';
import { QueryBkCourseMappingDto } from './dto/query-bk-course-mapping.dto';

@ApiTags('BK-Course Mapping')
@Controller('bk-course-mapping')
export class BkCourseMappingController {
  constructor(private readonly service: BkCourseMappingService) {}

  @Get()
  @ApiOperation({ summary: 'Get BK-Course mapping matrix for a curriculum' })
  getMatrix(@Query() query: QueryBkCourseMappingDto) {
    return this.service.getMatrix(query);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save (replace) all BK-Course mappings for a curriculum' })
  saveMappings(@Body() dto: SaveBkCourseMappingsDto) {
    return this.service.saveMappings(dto);
  }
}
