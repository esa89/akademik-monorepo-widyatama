import { Module } from '@nestjs/common';
import { BahanKajianController } from './bahan-kajian.controller';
import { BahanKajianService } from './bahan-kajian.service';
import { BahanKajianRepository } from './bahan-kajian.repository';

@Module({
  controllers: [BahanKajianController],
  providers: [BahanKajianService, BahanKajianRepository],
  exports: [BahanKajianService, BahanKajianRepository],
})
export class BahanKajianModule {}
