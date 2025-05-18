import { createMegaMenuTable } from './db/migrations/mega-menu';

async function run() {
  try {
    console.log('Starting mega menu table creation...');
    await createMegaMenuTable();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run(); 