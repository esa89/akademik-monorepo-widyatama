import { Module } from '@nestjs/common';
import { RubricController } from './rubric.controller';
import { RubricService } from './rubric.service';
import { RubricRepository } from './rubric.repository';

@Module({
  controllers: [RubricController],
  providers: [RubricService, RubricRepository],
  exports: [RubricService, RubricRepository],
})
export class RubricModule {}
