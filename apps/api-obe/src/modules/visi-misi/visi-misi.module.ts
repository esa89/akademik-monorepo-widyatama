import { Module } from '@nestjs/common';
import { VisiMisiController } from './visi-misi.controller';
import { VisiMisiService } from './visi-misi.service';
import { VisiMisiRepository } from './visi-misi.repository';

@Module({
  controllers: [VisiMisiController],
  providers: [VisiMisiService, VisiMisiRepository],
  exports: [VisiMisiService],
})
export class VisiMisiModule {}
