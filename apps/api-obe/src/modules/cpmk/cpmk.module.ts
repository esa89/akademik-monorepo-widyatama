import { Module } from '@nestjs/common';
import { CpmkController } from './cpmk.controller';
import { CpmkService } from './cpmk.service';
import { CpmkRepository } from './cpmk.repository';

@Module({
  controllers: [CpmkController],
  providers: [CpmkService, CpmkRepository],
  exports: [CpmkService, CpmkRepository],
})
export class CpmkModule {}
