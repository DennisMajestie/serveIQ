import { Test } from '@nestjs/testing';
import { BusinessController } from './business.controller';
describe('BusinessController', () => {
    let controller;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [BusinessController],
        }).compile();
        controller = module.get(BusinessController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=business.controller.spec.js.map