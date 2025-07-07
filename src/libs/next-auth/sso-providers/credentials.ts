import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const provider = {
  id: 'credentials',
  provider: Credentials({
    async authorize(credentials) {
      try {
        const validatedCredentials = credentialsSchema.parse(credentials);

        // Dynamic import to avoid circular dependencies
        const { serverDB } = await import('@/database/server');
        const { users } = await import('@/database/schemas');

        // Find user by email
        const user = await serverDB.query.users.findFirst({
          where: eq(users.email, validatedCredentials.email),
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Check if user has a password (for users created via SSO)
        if (!user.password) {
          throw new Error('Please sign in with your SSO provider');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(validatedCredentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Return user object for session
        return {
          email: user.email,
          id: user.id,
          image: user.avatar,
          name: user.fullName || user.username,
        };
      } catch (error) {
        console.error('Authentication error:', error);
        return null;
      }
    },
    credentials: {
      email: { label: 'Email', placeholder: 'user@example.com', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    name: 'Credentials',
  }),
};

export default provider;
