import { Module } from '@nestjs/common';
import { CplProfileMappingController } from './cpl-profile-mapping.controller';
import { CplProfileMappingService } from './cpl-profile-mapping.service';
import { CplProfileMappingRepository } from './cpl-profile-mapping.repository';

@Module({
  controllers: [CplProfileMappingController],
  providers: [CplProfileMappingService, CplProfileMappingRepository],
  exports: [CplProfileMappingService],
})
export class CplProfileMappingModule {}
