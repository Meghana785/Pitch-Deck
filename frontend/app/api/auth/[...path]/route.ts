import { authApiHandler } from '@neondatabase/auth/next/server';

let defaultHandler: any = null;

const withLogging = (methodName: 'GET' | 'POST') => async (req: any, ctx: any) => {
    if (!defaultHandler) {
        defaultHandler = authApiHandler();
    }
    try {
        const res = await defaultHandler[methodName](req, ctx);
        return res;
    } catch (err) {
        console.error('Auth API Proxy Error:', err);
        return new Response(String(err), { status: 500 });
    }
};

export const GET = withLogging('GET');
export const POST = withLogging('POST');
