# 🔧 Authentication Error Fixes

## Problem Analysis

The application was experiencing multiple authentication-related errors:

1. **500 errors on `/api/auth/session`** - NextAuth returning HTML instead of JSON
2. **500 errors on tRPC endpoints** - All API calls failing with internal server errors
3. **Login/registration redirects failing** - Authentication flow broken
4. **Missing admin user with credentials** - Admin user created without password

## Root Causes Identified

### 1. Database Adapter Issues

- NextAuth database adapter initialization was failing silently
- No proper error handling in the adapter initialization
- Database connection issues during authentication

### 2. Missing Admin User Password

- The `create-admin-user.sh` script creates users without passwords
- Credentials provider requires passwords for authentication
- Environment variables `ADMIN_EMAIL` and `ADMIN_DEFAULT_PASSWORD` not being used properly

### 3. Authentication Configuration

- Missing proper error handling in NextAuth callbacks
- No debug logging to diagnose issues
- Missing trust host configuration

## Fixes Applied

### 1. Enhanced NextAuth Configuration (`src/libs/next-auth/index.ts`)

```typescript
// Added safe adapter initialization with error handling
const getAdapter = () => {
  if (!NEXT_PUBLIC_ENABLED_SERVER_SERVICE) return undefined;

  try {
    const { serverDB } = require('@/database/server');
    return LobeNextAuthDbAdapter(serverDB);
  } catch (error) {
    console.error('Failed to initialize NextAuth database adapter:', error);
    console.warn('Falling back to JWT-only mode without database adapter');
    return undefined;
  }
};
```

### 2. Improved Error Handling (`src/libs/next-auth/auth.config.ts`)

```typescript
// Added try-catch blocks in NextAuth callbacks
async jwt({ token, user }) {
  try {
    if (user?.id) {
      token.userId = user?.id;
    }
    return token;
  } catch (error) {
    console.error('[NextAuth] JWT callback error:', error);
    return token;
  }
}
```

### 3. Enhanced Credentials Provider (`src/libs/next-auth/sso-providers/credentials.ts`)

```typescript
// Added comprehensive logging and error handling
async authorize(credentials) {
  try {
    console.log('[Credentials Provider] Starting authentication process');

    const validatedCredentials = credentialsSchema.parse(credentials);
    console.log('[Credentials Provider] Credentials validated for email:', validatedCredentials.email);

    // ... authentication logic with detailed logging
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Credentials Provider] Validation error:', error.errors);
    } else {
      console.error('[Credentials Provider] Authentication error:', error.message);
    }
    return null;
  }
}
```

### 4. Created Admin User Script (`scripts/create-admin-user.ts`)

```typescript
// Create admin user with proper password hashing
const hashedPassword = await bcrypt.hash(ADMIN_DEFAULT_PASSWORD, 10);

const newUser = await serverDB
  .insert(users)
  .values({
    id: nanoid(),
    email: ADMIN_EMAIL,
    username: ADMIN_EMAIL.split('@')[0],
    fullName: 'Administrator',
    password: hashedPassword, // ✅ Now includes password
    isAdmin: true,
    isOnboarded: true,
    emailVerifiedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  .returning();
```

### 5. Environment Configuration (`.env`)

```bash
# Added missing AUTH_TRUST_HOST
AUTH_TRUST_HOST=true

# Ensured proper NextAuth configuration
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1
NEXT_AUTH_SSO_PROVIDERS=credentials
NEXT_AUTH_SECRET=90e258ffa76f344ba99b2f59e1ff791998c3b6e6f407bb3f3d42bd54b4b815eb
NEXTAUTH_URL=http://64.23.237.16:3210
```

## Files Modified

1. **`src/libs/next-auth/index.ts`** - Safe adapter initialization
2. **`src/libs/next-auth/auth.config.ts`** - Error handling in callbacks
3. **`src/libs/next-auth/sso-providers/credentials.ts`** - Enhanced logging
4. **`scripts/create-admin-user.ts`** - New admin user creation script (NEW)
5. **`fix-authentication-errors.sh`** - Automated fix script (NEW)
6. **`.env`** - Added AUTH_TRUST_HOST

## How to Apply the Fixes

### Automated Fix (Recommended)

```bash
# Run the automated fix script
./fix-authentication-errors.sh
```

### Manual Steps

1. **Create admin user with password:**

   ```bash
   pnpm tsx scripts/create-admin-user.ts
   ```

2. **Restart the application:**

   ```bash
   docker-compose restart app
   ```

3. **Test authentication:**
   - Visit: <http://64.23.237.16:3210/next-auth/signin>
   - Login with: admin\@64.23.237.16
   - Password: ROJ0DotNWbFvkhVz

## Expected Results

After applying these fixes:

✅ **`/api/auth/session`** should return proper JSON responses
✅ **tRPC endpoints** should work without 500 errors\
✅ **Login/registration** should work properly
✅ **Admin user** can authenticate with credentials
✅ **Error logging** provides better debugging information

## Testing the Fixes

1. **Check authentication endpoint:**

   ```bash
   curl -s http://64.23.237.16:3210/api/auth/session | jq
   ```

2. **Test login flow:**
   - Navigate to: <http://64.23.237.16:3210/next-auth/signin>
   - Enter admin credentials
   - Should redirect to dashboard

3. **Verify admin access:**
   - Visit: <http://64.23.237.16:3210/admin>
   - Should show admin panel

## Troubleshooting

If issues persist:

1. **Check Docker logs:**

   ```bash
   docker-compose logs -f app
   ```

2. **Verify database connection:**

   ```bash
   docker exec agents-chat-postgres psql -U postgres -d agents_chat -c "SELECT * FROM users WHERE is_admin = true;"
   ```

3. **Restart all services:**
   ```bash
   docker-compose restart
   ```

## Security Notes

⚠️ **Important:** Change the default admin password after first login!

The default credentials are:

- Email: `admin@64.23.237.16`
- Password: `ROJ0DotNWbFvkhVz`

## Next Steps

1. Test the authentication flow thoroughly
2. Change default admin password
3. Configure additional authentication providers if needed
4. Monitor application logs for any remaining issues
