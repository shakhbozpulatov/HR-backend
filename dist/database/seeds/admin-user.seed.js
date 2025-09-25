"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdminUser = seedAdminUser;
const user_entity_1 = require("../../modules/users/entities/user.entity");
const crypto_utils_1 = require("../../common/utils/crypto.utils");
async function seedAdminUser(dataSource) {
    const userRepository = dataSource.getRepository(user_entity_1.User);
    const cryptoUtils = new crypto_utils_1.CryptoUtils();
    const adminEmail = 'shakhbozpulatovdev@gmail.com';
    const adminPassword = 'shakhbozpulatovdev@gmail.com';
    const existingAdmin = await userRepository.findOne({
        where: { email: adminEmail },
    });
    if (existingAdmin) {
        console.log('Admin user already exists');
        return;
    }
    const adminUser = userRepository.create({
        email: adminEmail,
        password_hash: cryptoUtils.hashPassword(adminPassword),
        role: user_entity_1.UserRole.ADMIN,
        active: true,
        mfa_enabled: false,
    });
    await userRepository.save(adminUser);
    console.log('Admin user created successfully');
}
//# sourceMappingURL=admin-user.seed.js.map