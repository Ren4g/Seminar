import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { VisitorController } from './visitor.controller';
import { VisitorRepository } from './visitor.repository';
import { VisitorService } from './visitor.service';

@Module({
  imports: [AuthModule],
  controllers: [VisitorController],
  providers: [VisitorRepository, VisitorService],
})
export class VisitorModule {}
