import { IsIn, IsInt, IsOptional, IsString, Length, Min, MinLength } from 'class-validator';

export class CreateContentDto {
  @IsInt()
  @Min(1)
  poiId!: number;

  @IsString()
  @MinLength(2)
  languageCode!: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  narrationText!: string;
}

export class UpdateContentDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsString()
  @MinLength(1)
  narrationText!: string;
}

export class RejectContentDto {
  @IsString()
  @MinLength(1)
  reason!: string;
}

export class TranslateContentDto {
  @IsString()
  @Length(2, 10)
  targetLanguageCode!: string;
}

export class ContentListQueryDto {
  @IsOptional()
  @IsIn(['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED', 'UNPUBLISHED'])
  status?: string;
}
