import { PartialType } from '@nestjs/swagger';
import { CreateSubCpmkDto } from './create-sub-cpmk.dto';

export class UpdateSubCpmkDto extends PartialType(CreateSubCpmkDto) {}
