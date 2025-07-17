/**
 * Script to create admin user for testing
 */
import 'dotenv/config';

// Force server mode for database operations
process.env.NEXT_PUBLIC_SERVICE_MODE = 'server';

import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

import { users } from '@/database/schemas';
import { serverDB } from '@/database/server';

// Admin credentials
const ADMIN_EMAIL = 'admin@ai4learning.com.br';
const ADMIN_PASSWORD = 'Admin@2024!'; // Strong password for testing

console.log('🔐 Creating admin user for testing...');
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
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

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
      console.log('User ID:', existingUser.id);
    } else {
      console.log('🆕 Creating new admin user...');

      // Hash the password
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

      // Create new admin user
      const newUser = await serverDB
        .insert(users)
        .values({
          id: nanoid(),
          email: ADMIN_EMAIL,
          username: 'admin',
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
    console.log('🔑 Password:', ADMIN_PASSWORD);
    console.log('🌐 Login URL: http://localhost:3010/next-auth/signin');
    console.log('⚙️  Admin Panel: http://localhost:3010/admin');
    console.log('');
    console.log('⚠️  IMPORTANT: This is a test password. Change it in production!');
    
    // Exit cleanly
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the script
createAdminUser().catch(console.error);