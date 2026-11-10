import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

// Every field is optional on PATCH, but a field that is sent must still be valid.
export class UpdateBookDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  author?: string;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
