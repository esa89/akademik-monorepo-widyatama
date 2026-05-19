import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { CplModule } from './modules/cpl/cpl.module';
import { GraduatesProfileModule } from './modules/graduates-profile/graduates-profile.module';
import { BahanKajianModule } from './modules/bahan-kajian/bahan-kajian.module';
import { CpmkModule } from './modules/cpmk/cpmk.module';
import { SubCpmkModule } from './modules/sub-cpmk/sub-cpmk.module';
import { AssessmentModule } from './modules/assessment/assessment.module';
import { RubricModule } from './modules/rubric/rubric.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    CplModule,
    GraduatesProfileModule,
    BahanKajianModule,
    CpmkModule,
    SubCpmkModule,
    AssessmentModule,
    RubricModule,
  ],
})
export class AppModule {}
