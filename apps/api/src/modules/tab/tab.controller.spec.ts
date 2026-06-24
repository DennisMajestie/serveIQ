import { Test, TestingModule } from '@nestjs/testing';
import { TabController } from './tab.controller';

describe('TabController', () => {
  let controller: TabController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TabController],
    }).compile();

    controller = module.get<TabController>(TabController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
