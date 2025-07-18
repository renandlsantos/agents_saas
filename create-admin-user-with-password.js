#!/usr/bin/env node
/**
 * ============================================================================
 * 🔐 CREATE ADMIN USER WITH PASSWORD - AGENTS CHAT
 * ============================================================================
 * Node.js script to create admin user with proper password hashing
 * ============================================================================
 */
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { nanoid } from 'nanoid';
import { Pool } from 'pg';

import * as schema from './src/database/schemas/index.js';

const { users } = schema;

// Get environment variables
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@64.23.237.16';
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'ROJ0DotNWbFvkhVz';

console.log('🔐 Creating admin user with credentials...');
console.log('Database URL:', DATABASE_URL ? 'Configured' : 'Missing');
console.log('Admin Email:', ADMIN_EMAIL);

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function createAdminUser() {
  try {
    // Initialize database connection
    const pool = new Pool({ connectionString: DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log('✅ Database connection established');

    // Check if admin user already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, ADMIN_EMAIL),
    });

    if (existingUser) {
      console.log('👤 Admin user already exists, updating...');

      // Hash the password
      const hashedPassword = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);

      // Update existing user to be admin with password
      await db
        .update(users)
        .set({
          isAdmin: true,
          password: hashedPassword,
          isOnboarded: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id));

      console.log('✅ Admin user updated successfully');
    } else {
      console.log('🆕 Creating new admin user...');

      // Hash the password
      const hashedPassword = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);

      // Create new admin user
      const newUser = await db
        .insert(users)
        .values({
          id: nanoid(),
          email: ADMIN_EMAIL,
          username: ADMIN_EMAIL.split('@')[0],
          fullName: 'Administrator',
          password: hashedPassword,
          isAdmin: true,
          isOnboarded: true,
          emailVerifiedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      console.log('✅ Admin user created successfully');
      console.log('User ID:', newUser[0].id);
    }

    // Close database connection
    await pool.end();

    console.log('');
    console.log('🎉 ADMIN USER SETUP COMPLETE!');
    console.log('==================================');
    console.log('📧 Email:', ADMIN_EMAIL);
    console.log('🔑 Password:', ADMIN_DEFAULT_PASSWORD);
    console.log('🌐 Login URL: http://64.23.237.16:3210/next-auth/signin');
    console.log('⚙️  Admin Panel: http://64.23.237.16:3210/admin');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
}

// Run the script
await createAdminUser();
