import { Test } from '@nestjs/testing';
import { BranchService } from './branch.service';
describe('BranchService', () => {
    let service;
    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [BranchService],
        }).compile();
        service = module.get(BranchService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
//# sourceMappingURL=branch.service.spec.js.map