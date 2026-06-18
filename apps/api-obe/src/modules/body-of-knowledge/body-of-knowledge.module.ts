import { Module } from '@nestjs/common';
import { BodyOfKnowledgeController } from './body-of-knowledge.controller';
import { BodyOfKnowledgeService } from './body-of-knowledge.service';
import { BodyOfKnowledgeRepository } from './body-of-knowledge.repository';

@Module({
  controllers: [BodyOfKnowledgeController],
  providers: [BodyOfKnowledgeService, BodyOfKnowledgeRepository],
  exports: [BodyOfKnowledgeService, BodyOfKnowledgeRepository],
})
export class BodyOfKnowledgeModule {}
