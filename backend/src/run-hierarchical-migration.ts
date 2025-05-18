import { migrateToHierarchicalCollections } from './db/migrations/hierarchical-collections';

async function run() {
  try {
    console.log('Starting hierarchical collections migration...');
    await migrateToHierarchicalCollections();
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

run(); 