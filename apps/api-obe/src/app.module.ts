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
import { VisiMisiModule } from './modules/visi-misi/visi-misi.module';
import { CplProfileMappingModule } from './modules/cpl-profile-mapping/cpl-profile-mapping.module';
import { BodyOfKnowledgeModule } from './modules/body-of-knowledge/body-of-knowledge.module';
import { CplBkMappingModule } from './modules/cpl-bk-mapping/cpl-bk-mapping.module';
import { BkCourseMappingModule } from './modules/bk-course-mapping/bk-course-mapping.module';
import { CpmkCourseMappingModule } from './modules/cpmk-course-mapping/cpmk-course-mapping.module';
import { CpmkCplMappingModule } from './modules/cpmk-cpl-mapping/cpmk-cpl-mapping.module';
import { AssessmentComponentModule } from './modules/assessment-component/assessment-component.module';
import { CourseCpmkWeightModule } from './modules/course-cpmk-weight/course-cpmk-weight.module';
import { StudentCpmkScoreModule } from './modules/student-cpmk-score/student-cpmk-score.module';

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
    VisiMisiModule,
    CplProfileMappingModule,
    BodyOfKnowledgeModule,
    CplBkMappingModule,
    BkCourseMappingModule,
    CpmkCourseMappingModule,
    CpmkCplMappingModule,
    AssessmentComponentModule,
    CourseCpmkWeightModule,
    StudentCpmkScoreModule,
  ],
})
export class AppModule {}
