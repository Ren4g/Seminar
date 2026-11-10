import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TranslationDto {
  @IsString()
  @Length(2, 10)
  languageCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name!: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;
}

export class CreateLanguageDto {
  @IsString()
  @Length(2, 10)
  code!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class CreateLocationDto {
  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations!: TranslationDto[];
}

export class CreatePoiDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ValidateNested({ each: true })
  @Type(() => TranslationDto)
  translations!: TranslationDto[];
}

export class UpdateActiveDto {
  @IsBoolean()
  isActive!: boolean;
}

export class CreateVoiceDto {
  @IsString()
  @Length(2, 10)
  languageCode!: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  providerVoiceKey!: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class SetDefaultVoiceDto {
  @IsInt()
  @Min(1)
  voiceId!: number;
}

export class CreateQrDto {
  @IsOptional()
  @IsString()
  imagePath?: string;
}
