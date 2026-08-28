import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  avatar?: string | null;
}

const JWT_SECRET = process.env.JWT_SECRET || 'reachinbox_super_secret_jwt_key_2026';

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, name: true, avatar: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized. User no longer exists.' });
    }

    req.user = user;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
  }
}
