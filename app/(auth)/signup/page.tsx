'use client';

import { useRouter } from 'next/navigation';
import AuthForm from '@/components/auth/AuthForm';
import PublicLayout from '@/components/layout/PublicLayout';

export default function SignUpPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/dashboard/faces');
  };

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto py-12 px-4">
        <AuthForm mode="signup" onSuccess={handleSuccess} />
      </div>
    </PublicLayout>
  );
}
