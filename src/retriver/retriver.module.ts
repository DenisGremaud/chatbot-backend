import { Module } from '@nestjs/common';
import { RetriverService } from './retriver.service';
import { RetriverController } from './retriver.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RetriverService],
  controllers: [RetriverController],
  exports: [RetriverService],
})
export class RetriverModule {}
