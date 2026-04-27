import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('pitchready_token')?.value;
    const isProtectedPath = ['/dashboard', '/analyze', '/report', '/admin'].some(path => 
        request.nextUrl.pathname.startsWith(path)
    );

    if (isProtectedPath && !token) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/analyze/:path*', '/report/:path*', '/admin/:path*'],
};
