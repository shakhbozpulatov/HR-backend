"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Init1762633552805 = void 0;
class Init1762633552805 {
    constructor() {
        this.name = 'Init1762633552805';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" ADD "photo_url" text`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "photo_url"`);
    }
}
exports.Init1762633552805 = Init1762633552805;
//# sourceMappingURL=1762633552805-init.js.map