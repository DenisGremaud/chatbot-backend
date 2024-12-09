import { Test, TestingModule } from '@nestjs/testing';
import { ChartToolsService } from './chart-tools.service';

describe('ChartToolsService', () => {
  let service: ChartToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChartToolsService],
    }).compile();

    service = module.get<ChartToolsService>(ChartToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
