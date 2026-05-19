import { PartialType } from '@nestjs/swagger';
import { CreateBahanKajianDto } from './create-bahan-kajian.dto';

export class UpdateBahanKajianDto extends PartialType(CreateBahanKajianDto) {}
