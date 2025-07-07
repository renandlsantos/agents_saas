# Native Auth.js (NextAuth) Setup Guide

This guide explains how to enable native Auth.js authentication with email/password login and signup in Lobe Chat.

## Overview

I've enabled native Auth.js authentication with credentials provider support. Users can now:

- Sign up with email and password
- Sign in with email and password
- Use existing SSO providers alongside credentials authentication

## Changes Made

### 1. Database Schema Update

Added a `password` field to the users table in `/src/database/schemas/user.ts`:

```typescript
// Password for credentials auth (hashed)
password: text('password'),
```

### 2. Credentials Provider

Created a new credentials provider in `/src/libs/next-auth/sso-providers/credentials.ts` that:

- Validates user credentials
- Checks password using bcrypt
- Returns user session data

### 3. Authentication Pages

#### Sign Up Page

- **Route**: `/next-auth/signup`
- **Component**: `/src/app/[variants]/(auth)/next-auth/signup/AuthSignUpBox.tsx`
- Features:
  - Email validation
  - Password confirmation
  - Username (optional)
  - Auto sign-in after registration

#### Sign In Pages

- **Main Sign In**: `/next-auth/signin` - Shows all available providers including "Sign in with Email"
- **Credentials Sign In**: `/next-auth/signin/credentials` - Dedicated email/password login form

### 4. Sign Up API Endpoint

Created `/src/app/(backend)/api/auth/signup/route.ts` that:

- Validates user input
- Checks for existing users
- Hashes passwords with bcrypt
- Creates new user accounts

## Environment Variables

To enable Auth.js authentication, you need to set the following environment variables:

```bash
# Enable NextAuth (required)
NEXT_PUBLIC_ENABLE_NEXT_AUTH=1

# NextAuth Secret (required - generate with: openssl rand -base64 32)
NEXT_AUTH_SECRET=your-secret-key-here

# SSO Providers (add 'credentials' to enable email/password auth)
NEXT_AUTH_SSO_PROVIDERS=credentials,auth0,github

# Enable server mode for database support
NEXT_PUBLIC_SERVICE_MODE=server

# Database URL (required for server mode)
DATABASE_URL=postgres://username:password@host:port/database

# Encryption key for sensitive data (generate with: openssl rand -base64 32)
KEY_VAULTS_SECRET=your-encryption-key-here
```

## Database Migration

After setting up the environment variables, run the database migration to add the password field:

```bash
# Generate migration
pnpm db:generate

# Apply migration
pnpm db:migrate
```

## Usage

### For Users

1. **Sign Up**: Navigate to `/next-auth/signup` to create a new account
2. **Sign In**: Navigate to `/next-auth/signin` and click "Sign in with Email"
3. **SSO Options**: Other SSO providers (if configured) will appear alongside the email option

### For Developers

The authentication flow:

1. User signs up via `/api/auth/signup` endpoint
2. Password is hashed using bcrypt before storage
3. User signs in using NextAuth credentials provider
4. Session is created with JWT strategy
5. User ID is available in session for authorization

## Security Considerations

1. **Password Storage**: Passwords are hashed using bcrypt with a cost factor of 10
2. **Session Management**: Uses JWT strategy for stateless sessions
3. **HTTPS Required**: Always use HTTPS in production
4. **Secret Keys**: Ensure `NEXT_AUTH_SECRET` and `KEY_VAULTS_SECRET` are strong and unique

## Customization

To customize the authentication experience:

1. **Modify Sign Up Fields**: Edit `AuthSignUpBox.tsx` to add/remove fields
2. **Change Password Requirements**: Update validation in both frontend and API
3. **Add OAuth Providers**: Configure additional providers in environment variables
4. **Customize UI**: Modify the styling in the authentication components

## Troubleshooting

### Common Issues

1. **"User with this email already exists"**: Email is already registered, use sign in instead
2. **"Invalid credentials"**: Check email and password are correct
3. **Database connection errors**: Ensure `DATABASE_URL` is correctly configured
4. **Migration errors**: Run `pnpm db:push` for development or `pnpm db:migrate` for production

### Debug Mode

Enable debug mode for detailed logs:

```bash
NEXT_AUTH_DEBUG=true
```

## Next Steps

1. Set up email verification (optional)
2. Add password reset functionality
3. Implement two-factor authentication
4. Add social login providers
