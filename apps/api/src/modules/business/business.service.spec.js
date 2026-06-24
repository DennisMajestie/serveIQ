import { Test } from '@nestjs/testing';
import { BusinessService } from './business.service';
describe('BusinessService', () => {
    let service;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [BusinessService],
        }).compile();
        service = module.get(BusinessService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=business.service.spec.js.map