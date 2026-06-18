import { Module } from '@nestjs/common';
import { CpmkCplMappingController } from './cpmk-cpl-mapping.controller';
import { CpmkCplMappingService } from './cpmk-cpl-mapping.service';
import { CpmkCplMappingRepository } from './cpmk-cpl-mapping.repository';

@Module({
  controllers: [CpmkCplMappingController],
  providers: [CpmkCplMappingService, CpmkCplMappingRepository],
})
export class CpmkCplMappingModule {}
