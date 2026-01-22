import dynamic from 'next/dynamic';

const UpdatePasswordClient = dynamic(() => import('@/components/UpdatePasswordClient'), {
  ssr: false
});

export default function UpdatePasswordPage() {
  return <UpdatePasswordClient />;
}