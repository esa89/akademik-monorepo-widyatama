import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { StudyProgramModule } from './modules/study-program/study-program.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { CourseModule } from './modules/course/course.module';
import { AcademicSemesterModule } from './modules/academic-semester/academic-semester.module';
import { LecturerModule } from './modules/lecturer/lecturer.module';
import { StudentModule } from './modules/student/student.module';
import { AcademicClassModule } from './modules/academic-class/academic-class.module';

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
    LecturerModule,
    StudentModule,
    AcademicClassModule,
  ],
})
export class AppModule {}
