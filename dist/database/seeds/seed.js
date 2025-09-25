"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin_user_seed_1 = require("./admin-user.seed");
const database_config_1 = require("../../config/database.config");
async function runSeeds() {
    try {
        await database_config_1.default.initialize();
        console.log('Database connection established');
        await (0, admin_user_seed_1.seedAdminUser)(database_config_1.default);
        console.log('All seeds completed successfully');
    }
    catch (error) {
        console.error('Error running seeds:', error);
    }
    finally {
        await database_config_1.default.destroy();
    }
}
runSeeds();
//# sourceMappingURL=seed.js.map