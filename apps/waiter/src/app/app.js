import { __decorate } from "tslib";
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
let App = class App {
    title = 'waiter';
};
App = __decorate([
    Component({
        standalone: true,
        imports: [CommonModule, RouterModule],
        selector: 'app-root',
        templateUrl: './app.html',
        styleUrl: './app.scss',
    })
], App);
export { App };
//# sourceMappingURL=app.js.map