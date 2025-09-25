import { DataSource } from 'typeorm';
import { User, UserRole } from '@/modules/users/entities/user.entity';
import { CryptoUtils } from '@/common/utils/crypto.utils';

export async function seedAdminUser(dataSource: DataSource) {
  const userRepository = dataSource.getRepository(User);
  const cryptoUtils = new CryptoUtils();

  const adminEmail = 'shakhbozpulatovdev@gmail.com';
  const adminPassword = 'shakhbozpulatovdev@gmail.com';

  // Check if admin user already exists
  const existingAdmin = await userRepository.findOne({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Create admin user
  const adminUser = userRepository.create({
    email: adminEmail,
    password_hash: cryptoUtils.hashPassword(adminPassword),
    role: UserRole.ADMIN,
    active: true,
    mfa_enabled: false,
  });

  await userRepository.save(adminUser);
  console.log('Admin user created successfully');
}
