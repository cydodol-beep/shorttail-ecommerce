import UpdatePasswordForm from '@/components/UpdatePasswordForm';

export default function UpdatePasswordPage() {
  // This is a server component that just renders the form
  // The token validation will be handled within the UpdatePasswordForm component
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <UpdatePasswordForm />
      </div>
    </div>
  );
}