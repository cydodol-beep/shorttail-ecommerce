export const dynamic = 'force-dynamic';

// This is a server component that handles URL callbacks from Supabase
// and then renders the client component
import { createClient } from '@/lib/supabase/server';
import UpdatePasswordClient from './UpdatePasswordClient';

export default async function UpdatePasswordPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  // Process any auth callbacks from Supabase
  const supabase = await createClient();

  // Check if this is a recovery link and process it
  if (searchParams.type === 'recovery') {
    // Supabase will automatically process the token from the URL
    // when we try to get the session or refresh it
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session in server component:', error);
    }
  }

  return <UpdatePasswordClient />;
}