import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CplProfileMappingService } from './cpl-profile-mapping.service';
import { SaveMappingsDto } from './dto/save-mappings.dto';
import { QueryMappingDto } from './dto/query-mapping.dto';

@ApiTags('CPL-Profile Mapping')
@Controller('cpl-profile-mapping')
export class CplProfileMappingController {
  constructor(private readonly service: CplProfileMappingService) {}

  @Get()
  @ApiOperation({ summary: 'Get CPL-Profile mapping matrix for a curriculum' })
  getMatrix(@Query() query: QueryMappingDto) {
    return this.service.getMatrix(query);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save (replace) all CPL-Profile mappings for a curriculum' })
  saveMappings(@Body() dto: SaveMappingsDto) {
    return this.service.saveMappings(dto);
  }
}
