import { Test, TestingModule } from '@nestjs/testing';
import { RetriverService } from './retriver.service';

describe('RetriverService', () => {
  let service: RetriverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RetriverService],
    }).compile();

    service = module.get<RetriverService>(RetriverService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
