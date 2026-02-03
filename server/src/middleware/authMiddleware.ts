import { createClient } from '@supabase/supabase-js';
import { NextFunction, Request, Response } from 'express';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: string;
                email?: string;
            };
        }
    }
}

/**
 * Middleware to verify Supabase JWT token
 * Extracts user info and attaches to req.user
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT using Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.warn('🔒 Auth failed:', error?.message || 'No user found');
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach user info to request
        req.user = {
            id: user.id,
            email: user.email,
        };

        console.log(`🔓 Authenticated user: ${user.email}`);
        next();
    } catch (err: any) {
        console.error('🔒 Auth middleware error:', err);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}
