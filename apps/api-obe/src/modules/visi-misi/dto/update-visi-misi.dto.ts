import { PartialType } from '@nestjs/swagger';
import { CreateVisiMisiDto } from './create-visi-misi.dto';

export class UpdateVisiMisiDto extends PartialType(CreateVisiMisiDto) {}
