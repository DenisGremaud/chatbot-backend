import { Test, TestingModule } from '@nestjs/testing';
import { RetriverController } from './retriver.controller';

describe('RetriverController', () => {
  let controller: RetriverController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RetriverController],
    }).compile();

    controller = module.get<RetriverController>(RetriverController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
