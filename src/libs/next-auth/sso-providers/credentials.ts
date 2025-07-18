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
        console.log('[Credentials Provider] Starting authentication process');

        // Validate input credentials
        const validatedCredentials = credentialsSchema.parse(credentials);
        console.log(
          '[Credentials Provider] Credentials validated for email:',
          validatedCredentials.email,
        );

        // Dynamic import to avoid circular dependencies
        const { serverDB } = await import('@/database/server');
        const { users } = await import('@/database/schemas');
        console.log('[Credentials Provider] Database imported successfully');

        // Find user by email
        const user = await serverDB.query.users.findFirst({
          where: eq(users.email, validatedCredentials.email),
        });

        if (!user) {
          console.log(
            '[Credentials Provider] User not found for email:',
            validatedCredentials.email,
          );
          throw new Error('Invalid credentials');
        }

        console.log('[Credentials Provider] User found:', { id: user.id, email: user.email });

        // Check if user has a password (for users created via SSO)
        if (!user.password) {
          console.log('[Credentials Provider] User has no password, likely SSO user');
          throw new Error('Please sign in with your SSO provider');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(validatedCredentials.password, user.password);

        if (!isPasswordValid) {
          console.log('[Credentials Provider] Invalid password for user:', user.email);
          throw new Error('Invalid credentials');
        }

        console.log('[Credentials Provider] Authentication successful for user:', user.email);

        // Return user object for session
        return {
          email: user.email,
          id: user.id,
          image: user.avatar,
          name: user.fullName || user.username,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.error('[Credentials Provider] Validation error:', error.errors);
        } else {
          console.error(
            '[Credentials Provider] Authentication error:',
            error instanceof Error ? error.message : String(error),
          );
        }
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
