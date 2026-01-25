import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@runright/common';
import { logger } from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Validation Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export class AuthController {

  static async register(req: Request, res: Response) {
    try {
      const { email, password } = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword
        }
      });

      logger.info('User registered', { userId: user.id });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

      return res.status(201).json({ token, user: { id: user.id, email: user.email } });

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: (error as z.ZodError)});
      }
      logger.error('Registration failed', { error: error.message });
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });

        return res.json({ token, user: { id: user.id, email: user.email } });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: (error as z.ZodError)});
        }
        logger.error('Login failed', { error: error.message });
        return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
