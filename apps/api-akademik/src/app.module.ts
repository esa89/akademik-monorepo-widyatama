import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { StudyProgramModule } from './modules/study-program/study-program.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { CourseModule } from './modules/course/course.module';
import { AcademicSemesterModule } from './modules/academic-semester/academic-semester.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    FacultyModule,
    StudyProgramModule,
    CurriculumModule,
    CourseModule,
    AcademicSemesterModule,
  ],
})
export class AppModule {}
