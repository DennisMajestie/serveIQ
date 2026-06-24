import { Test } from '@nestjs/testing';
import { TabController } from './tab.controller';
describe('TabController', () => {
    let controller;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [TabController],
        }).compile();
        controller = module.get(TabController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=tab.controller.spec.js.map