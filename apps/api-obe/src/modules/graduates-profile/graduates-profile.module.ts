import { Module } from '@nestjs/common';
import { GraduatesProfileController } from './graduates-profile.controller';
import { GraduatesProfileService } from './graduates-profile.service';
import { GraduatesProfileRepository } from './graduates-profile.repository';

@Module({
  controllers: [GraduatesProfileController],
  providers: [GraduatesProfileService, GraduatesProfileRepository],
  exports: [GraduatesProfileService, GraduatesProfileRepository],
})
export class GraduatesProfileModule {}
