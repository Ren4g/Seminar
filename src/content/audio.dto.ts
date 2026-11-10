import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UploadAudioDto {
  @IsOptional()
  @IsString()
  fileName!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fileSize!: number;
}

export class ElevenLabsAudioDto {
  @IsInt()
  @Min(1)
  voiceId!: number;

  @IsOptional()
  @IsString()
  modelId?: string;
}
