import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class PublishedContentQueryDto {
  @IsOptional()
  @IsString()
  languageCode?: string;
}

export class ActivityEventDto {
  @IsUUID()
  eventId!: string;

  @IsIn(['PAGE_VIEW', 'QR_OPEN', 'AUDIO_START', 'AUDIO_PLAY_DURATION'])
  eventType!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  poiId?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  locationId?: number;

  @IsOptional()
  @IsString()
  languageCode?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(2147483647)
  durationMs?: number;

  @IsOptional()
  @IsString()
  anonymousSessionKey?: string;
}
