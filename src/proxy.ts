import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabaseUrl } from "@/lib/supabase-url";

/** Keeps the staff (Supabase Auth) session fresh on unit/admin pages. */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  if (!data.user && !request.nextUrl.pathname.startsWith("/staff")) {
    return NextResponse.redirect(new URL(`/staff/login?next=${request.nextUrl.pathname}`, request.url));
  }
  return response;
}

export const config = { matcher: ["/unit/:path*", "/admin/:path*", "/staff/:path*"] };
