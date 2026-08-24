import Database from '@/database/database';

async function connect_to_database() {
  const db = Database.getInstance();
  await Promise.all([import('@/models/Product')]);
  await db.connect();
}

export default connect_to_database;
