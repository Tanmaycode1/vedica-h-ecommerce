import { Knex } from 'knex';
import { generateUsers } from '../../utils/seedHelpers';

export async function seed(knex: Knex): Promise<void> {
  // Deletes ALL existing entries
  await knex('users').del();

  // Insert seed users
  const users = generateUsers();
  await knex('users').insert(users);
} 