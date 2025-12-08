import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // If Supabase env vars are missing, just pass through
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Use getUser() instead of getSession() to refresh the token
  // getSession() only reads from storage and doesn't refresh expired tokens
  // getUser() makes a network request that validates and refreshes the token
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register', '/products', '/api'];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // If there's a refresh error, redirect to login for protected routes
  if (error && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Role-based access control - use session metadata for role instead of fetching
  if (user) {
    // Get role from user metadata or fetch once
    let role = user.user_metadata?.role;
    
    // Only fetch profile if role not in metadata (backward compatibility)
    if (!role) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      role = profile?.role || 'normal_user';
    }

    // Admin routes - only master_admin and normal_admin
    if (pathname.startsWith('/admin')) {
      if (!['master_admin', 'normal_admin'].includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    // Kasir routes - kasir and super_user
    if (pathname.startsWith('/kasir')) {
      if (!['kasir', 'super_user'].includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
      }
    }

    // Dashboard routes - all authenticated users except redirect admins/kasir to their panels
    if (pathname === '/dashboard') {
      if (['master_admin', 'normal_admin'].includes(role)) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin';
        return NextResponse.redirect(url);
      }
      if (role === 'kasir') {
        const url = request.nextUrl.clone();
        url.pathname = '/kasir';
        return NextResponse.redirect(url);
      }
    }

    // Redirect authenticated users away from login/register
    if (pathname === '/login' || pathname === '/register') {
      const url = request.nextUrl.clone();
      if (['master_admin', 'normal_admin'].includes(role)) {
        url.pathname = '/admin';
      } else if (role === 'kasir') {
        url.pathname = '/kasir';
      } else {
        url.pathname = '/dashboard';
      }
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
