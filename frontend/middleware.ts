import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

export const middleware = neonAuthMiddleware({
    loginUrl: '/login',
});

export const config = {
    matcher: ['/dashboard/:path*', '/analyze/:path*', '/report/:path*', '/admin/:path*'],
};
