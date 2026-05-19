import { PartialType } from '@nestjs/swagger';
import { CreateCpmkDto } from './create-cpmk.dto';

export class UpdateCpmkDto extends PartialType(CreateCpmkDto) {}
