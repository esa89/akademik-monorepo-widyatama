import { Controller, Get, Post, Body, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CpmkCourseMappingService } from './cpmk-course-mapping.service';
import { SaveCpmkCourseMappingDto } from './dto/save-cpmk-course-mapping.dto';
import { QueryCpmkCourseMappingDto } from './dto/query-cpmk-course-mapping.dto';

@ApiTags('CPMK-Course Mapping')
@ApiBearerAuth()
@Controller('cpmk-course-mapping')
export class CpmkCourseMappingController {
  constructor(private readonly service: CpmkCourseMappingService) {}

  @Get('matrix')
  @ApiOperation({ summary: 'Get CPL-CPMK-MK matrix for a curriculum' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Matrix retrieved successfully' })
  async getMatrix(@Query() query: QueryCpmkCourseMappingDto) {
    return this.service.getMatrix(query);
  }

  @Post()
  @ApiOperation({ summary: 'Save course mappings for a CPMK (replaces existing)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Mappings saved successfully' })
  async saveMappings(@Body() dto: SaveCpmkCourseMappingDto) {
    const count = await this.service.saveMappings(dto);
    return { count, message: `Saved ${count} course mapping(s) for CPMK` };
  }
}
