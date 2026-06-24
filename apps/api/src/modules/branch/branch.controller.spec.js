import { Test } from '@nestjs/testing';
import { BranchController } from './branch.controller';
describe('BranchController', () => {
    let controller;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [BranchController],
        }).compile();
        controller = module.get(BranchController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=branch.controller.spec.js.map