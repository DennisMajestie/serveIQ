import { __decorate } from "tslib";
import { Pipe } from '@angular/core';
let KoboPipe = class KoboPipe {
    transform(value) {
        const naira = value / 100;
        return naira.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
    }
};
KoboPipe = __decorate([
    Pipe({ name: 'kobo' })
], KoboPipe);
export { KoboPipe };
//# sourceMappingURL=kobo.pipe.js.map