import { Test } from '@nestjs/testing';
import { TableController } from './table.controller';
describe('TableController', () => {
    let controller;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [TableController],
        }).compile();
        controller = module.get(TableController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=table.controller.spec.js.map