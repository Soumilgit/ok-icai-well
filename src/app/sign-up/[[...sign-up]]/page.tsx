import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">CA Law Portal</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-sm',
              card: 'shadow-none',
              headerTitle: 'hidden',
              headerSubtitle: 'hidden'
            }
          }}
          redirectUrl="/?welcome=true"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}