import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
describe('AuthController', () => {
    let controller;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            controllers: [AuthController],
        }).compile();
        controller = module.get(AuthController);
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
});
//# sourceMappingURL=auth.controller.spec.js.map