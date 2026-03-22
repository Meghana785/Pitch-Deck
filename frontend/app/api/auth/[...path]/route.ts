import { authApiHandler } from '@neondatabase/auth/next/server';

const defaultHandler = authApiHandler();

const withLogging = (method: any) => async (req: any, ctx: any) => {
    try {
        const res = await method(req, ctx);
        return res;
    } catch (err) {
        console.error('Auth API Proxy Error:', err);
        return new Response(String(err), { status: 500 });
    }
};

export const GET = withLogging(defaultHandler.GET);
export const POST = withLogging(defaultHandler.POST);
