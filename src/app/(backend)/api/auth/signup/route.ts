import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { users } from '@/database/schemas';
import { serverDB } from '@/database/server';

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  username: z.string().min(3).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validatedData = signupSchema.parse(body);

    // Check if user already exists
    const existingUser = await serverDB.query.users.findFirst({
      where: eq(users.email, validatedData.email),
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User with this email already exists' }, { status: 409 });
    }

    // Check username availability if provided
    if (validatedData.username) {
      const existingUsername = await serverDB.query.users.findFirst({
        where: eq(users.username, validatedData.username),
      });

      if (existingUsername) {
        return NextResponse.json({ message: 'Username is already taken' }, { status: 409 });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const newUser = await serverDB
      .insert(users)
      .values({
        email: validatedData.email,
        emailVerifiedAt: new Date(),
        id: nanoid(),
        // For simplicity, marking as verified
isOnboarded: false,
        
password: hashedPassword, 
        username: validatedData.username,
      })
      .returning();

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          email: newUser[0].email,
          id: newUser[0].id,
          username: newUser[0].username,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors, message: 'Invalid input' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Failed to create user' }, { status: 500 });
  }
}
