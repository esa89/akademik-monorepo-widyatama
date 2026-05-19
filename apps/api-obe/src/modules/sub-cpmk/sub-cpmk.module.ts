import { Module } from '@nestjs/common';
import { SubCpmkController } from './sub-cpmk.controller';
import { SubCpmkService } from './sub-cpmk.service';
import { SubCpmkRepository } from './sub-cpmk.repository';

@Module({
  controllers: [SubCpmkController],
  providers: [SubCpmkService, SubCpmkRepository],
  exports: [SubCpmkService, SubCpmkRepository],
})
export class SubCpmkModule {}
