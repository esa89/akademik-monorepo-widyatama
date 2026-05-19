import { Module } from '@nestjs/common';
import { CplController } from './cpl.controller';
import { CplService } from './cpl.service';
import { CplRepository } from './cpl.repository';

@Module({
  controllers: [CplController],
  providers: [CplService, CplRepository],
  exports: [CplService, CplRepository],
})
export class CplModule {}
