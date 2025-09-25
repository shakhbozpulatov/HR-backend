import { DataSource } from 'typeorm';
import { seedAdminUser } from './admin-user.seed';
import dataSource from '@/config/database.config';

async function runSeeds() {
  try {
    await dataSource.initialize();
    console.log('Database connection established');

    await seedAdminUser(dataSource);

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Error running seeds:', error);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();