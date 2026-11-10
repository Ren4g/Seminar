import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { ContentModule } from './content/content.module';
import { VisitorModule } from './visitor/visitor.module';

@Module({
  imports: [DatabaseModule, AuthModule, CatalogModule, ContentModule, VisitorModule, HealthModule],
})
export class AppModule {}
