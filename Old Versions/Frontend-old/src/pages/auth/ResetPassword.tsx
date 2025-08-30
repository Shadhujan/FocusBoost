import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, AlertCircle, Check } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import Logo from '../../components/shared/Logo';

const ResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-indigo-50 flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <Logo />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8"
        >
          <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>

          {error && (
            <div className="mb-6 p-4 bg-error-50 text-error-700 rounded-xl flex items-center">
              <AlertCircle size={20} className="mr-2 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-6 p-4 bg-success-50 text-success-700 rounded-xl flex items-center">
                <Check size={20} className="mr-2 flex-shrink-0" />
                <p className="text-sm">Password reset instructions have been sent to your email.</p>
              </div>
              <Link to="/auth/login" className="btn-primary inline-flex items-center">
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={20} className="mr-2" />
                    Send Reset Instructions
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-600">
                Remember your password?{' '}
                <Link to="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
                  Sign In
                </Link>
              </p>
            </form>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default ResetPassword;