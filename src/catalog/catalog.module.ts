import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CatalogController } from './catalog.controller';
import { CatalogRepository } from './catalog.repository';
import { CatalogService } from './catalog.service';
import { GeocodingService } from './geocoding.service';

@Module({
  imports: [AuthModule],
  controllers: [CatalogController],
  providers: [CatalogRepository, CatalogService, GeocodingService],
  exports: [CatalogService, GeocodingService],
})
export class CatalogModule {}
