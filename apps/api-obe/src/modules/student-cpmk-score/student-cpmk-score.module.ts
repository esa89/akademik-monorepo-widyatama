import { Module } from '@nestjs/common';
import { StudentCpmkScoreController } from './student-cpmk-score.controller';
import { StudentCpmkScoreService } from './student-cpmk-score.service';
import { StudentCpmkScoreRepository } from './student-cpmk-score.repository';

@Module({
  controllers: [StudentCpmkScoreController],
  providers: [StudentCpmkScoreService, StudentCpmkScoreRepository],
  exports: [StudentCpmkScoreService],
})
export class StudentCpmkScoreModule {}
