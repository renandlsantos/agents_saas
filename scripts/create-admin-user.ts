/**
 * ============================================================================
 * 🔐 CREATE ADMIN USER WITH PASSWORD - AGENTS CHAT
 * ============================================================================
 * TypeScript script to create admin user with proper password hashing
 * Usage: pnpm tsx scripts/create-admin-user.ts
 * ============================================================================
 */
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { users } from '@/database/schemas';
import { serverDB } from '@/database/server';

// Get environment variables
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@64.23.237.16';
const ADMIN_DEFAULT_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'ROJ0DotNWbFvkhVz';

console.log('🔐 Creating admin user with credentials...');
console.log('Admin Email:', ADMIN_EMAIL);

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingUser = await serverDB.query.users.findFirst({
      where: eq(users.email, ADMIN_EMAIL),
    });

    if (existingUser) {
      console.log('👤 Admin user already exists, updating...');

      // Hash the password
      const hashedPassword = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);

      // Update existing user to be admin with password
      await serverDB
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
      const newUser = await serverDB
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
