import { Module } from '@nestjs/common';
import { ChartToolsService } from './chart-tools.service';

@Module({
  providers: [ChartToolsService],
  exports: [ChartToolsService],
})
export class ChartToolsModule {}
