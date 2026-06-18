import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CplBkMappingService } from './cpl-bk-mapping.service';
import { SaveCplBkMappingsDto } from './dto/save-cpl-bk-mappings.dto';
import { QueryCplBkMappingDto } from './dto/query-cpl-bk-mapping.dto';

@ApiTags('CPL-BK Mapping')
@Controller('cpl-bk-mapping')
export class CplBkMappingController {
  constructor(private readonly service: CplBkMappingService) {}

  @Get()
  @ApiOperation({ summary: 'Get CPL-BK mapping matrix for a curriculum' })
  getMatrix(@Query() query: QueryCplBkMappingDto) {
    return this.service.getMatrix(query);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save (replace) all CPL-BK mappings for a curriculum' })
  saveMappings(@Body() dto: SaveCplBkMappingsDto) {
    return this.service.saveMappings(dto);
  }
}
