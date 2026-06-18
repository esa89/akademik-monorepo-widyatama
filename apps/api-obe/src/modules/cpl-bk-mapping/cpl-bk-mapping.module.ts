import { Module } from '@nestjs/common';
import { CplBkMappingController } from './cpl-bk-mapping.controller';
import { CplBkMappingService } from './cpl-bk-mapping.service';
import { CplBkMappingRepository } from './cpl-bk-mapping.repository';

@Module({
  controllers: [CplBkMappingController],
  providers: [CplBkMappingService, CplBkMappingRepository],
  exports: [CplBkMappingService],
})
export class CplBkMappingModule {}
