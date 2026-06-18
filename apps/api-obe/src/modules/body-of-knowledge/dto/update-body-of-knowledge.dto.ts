import { PartialType } from '@nestjs/swagger';
import { CreateBodyOfKnowledgeDto } from './create-body-of-knowledge.dto';

export class UpdateBodyOfKnowledgeDto extends PartialType(CreateBodyOfKnowledgeDto) {}
