export const dynamic = 'force-dynamic';

// This is a server component that just renders the client component
// The client component handles all the logic
import UpdatePasswordClient from './UpdatePasswordClient';

export default function UpdatePasswordPage() {
  return <UpdatePasswordClient />;
}