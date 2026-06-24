import { Test } from '@nestjs/testing';
import { MenuController } from './menu.controller';
describe('MenuController', () => {
    let controller;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [MenuController],
        }).compile();
        controller = module.get(MenuController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=menu.controller.spec.js.map