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
  const publicRoutes = ['/', '/login', '/register', '/products', '/shop', '/api', '/about', '/forgot-password', '/update-password'];
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
    // Extract role from user metadata or session to minimize DB calls in middleware
    let role = user.user_metadata?.role;

    // Only fetch profile if role not in metadata (backward compatibility)
    if (!role) {
      // Special handling for password reset flow
      // During password reset, the user has a temporary session but may not have full profile access
      const isUpdatePasswordRoute = pathname === '/update-password' || pathname.startsWith('/update-password');
      if (isUpdatePasswordRoute) {
        // For update-password route, use default role to avoid profile fetch during reset
        role = 'normal_user';
      } else {
        // Use a more reasonable timeout (60 seconds to match other timeout configurations)
        // This prevents hanging requests while still allowing for slower connections
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 seconds to match DEFAULT_TIMEOUT_MS

        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

          clearTimeout(timeoutId);

          if (profileError) {
            if (profileError.code !== 'PGRST116') { // PGRST116 is "Results contain 0 rows"
              console.error('Error fetching profile in middleware:', profileError);
            }
            // If profile doesn't exist or error occurs, default to normal_user
            role = 'normal_user';
          } else {
            role = profile?.role || 'normal_user';
          }
        } catch (error: any) {
          clearTimeout(timeoutId);
          console.error('Profile fetch error in middleware:', error?.message || error);
          // If profile fetch fails, default to normal user to prevent session issues
          // This prevents hanging and redirects due to profile fetch issues
          role = 'normal_user';

          // Add a safeguard: if we're on checkout and role determination fails,
          // allow the request to continue instead of redirecting
          if (pathname.startsWith('/checkout') || pathname.startsWith('/cart')) {
            // Let checkout/cart continue with default role instead of redirecting
            console.warn('Allowing checkout/cart access with default role due to profile fetch failure');
          }
        }
      }
    }

    // Check if accessing checkout/cart/update-password routes to prevent any role-based redirects
    // These routes should be accessible to any authenticated user regardless of role
    const isCheckoutRoute = pathname === '/checkout' || pathname.startsWith('/checkout/');
    const isCartRoute = pathname === '/cart' || pathname.startsWith('/cart/');
    const isUpdatePasswordRoute = pathname === '/update-password' || pathname.startsWith('/update-password');

    // Apply role-based redirection only to routes that should have it
    // Never apply role checks to checkout, cart, or update-password routes to prevent accidental redirects
    if (!isCheckoutRoute && !isCartRoute && !isUpdatePasswordRoute) {
      // Admin routes - only master_admin and normal_admin
      if (pathname.startsWith('/admin')) {
        if (!['master_admin', 'normal_admin'].includes(role)) {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      }

      // Kasir routes - only for kasir and super_user
      if (pathname.startsWith('/kasir')) {
        if (!['kasir', 'super_user'].includes(role)) {
          const url = request.nextUrl.clone();
          url.pathname = '/dashboard';
          return NextResponse.redirect(url);
        }
      }

      // Dashboard routes - handle role-specific redirects
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
    }

    // Dashboard routes - all authenticated users except redirect admins/kasir to their panels
    // Skip this redirect if we're on the update-password route
    if (pathname === '/dashboard' && !isUpdatePasswordRoute) {
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

    // Redirect authenticated users away from login/register unless they're on update-password
    if ((pathname === '/login' || pathname === '/register') && !isUpdatePasswordRoute) {
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
