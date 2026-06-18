import { Controller, Get, Post, Body, Query, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CpmkCplMappingService } from './cpmk-cpl-mapping.service';
import { QueryCpmkCplMappingDto } from './dto/query-cpmk-cpl-mapping.dto';
import { SaveCpmkCplMappingDto } from './dto/save-cpmk-cpl-mapping.dto';

@ApiTags('CPMK-CPL Mapping')
@ApiBearerAuth()
@Controller('cpmk-cpl-mapping')
export class CpmkCplMappingController {
  constructor(private readonly service: CpmkCplMappingService) {}

  @Get()
  @ApiOperation({ summary: 'Get CPL-CPMK mapping matrix' })
  @ApiResponse({ status: HttpStatus.OK })
  async getMatrix(@Query() query: QueryCpmkCplMappingDto) {
    return this.service.getMatrix(query);
  }

  @Post()
  @ApiOperation({ summary: 'Save CPL-CPMK mappings (replaces all for curriculum)' })
  @ApiResponse({ status: HttpStatus.OK })
  async saveMappings(@Body() dto: SaveCpmkCplMappingDto) {
    return this.service.saveMappings(dto);
  }
}
