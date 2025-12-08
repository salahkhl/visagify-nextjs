import AuthForm from '@/components/auth/AuthForm';
import PublicLayout from '@/components/layout/PublicLayout';

export default function ResetPasswordPage() {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto py-12 px-4">
        <AuthForm mode="reset" />
      </div>
    </PublicLayout>
  );
}
