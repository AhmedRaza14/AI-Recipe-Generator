'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import GoogleLoginButton from './GoogleLoginButton';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import styles from './AuthForm.module.css';

interface AuthFormProps {
  mode?: 'login' | 'signup';
}

export default function AuthForm({ mode: initialMode = 'login' }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (mode === 'signup' && !name) {
      toast.error('Please enter your name');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (mode === 'signup') {
        response = await apiClient.signup(email, password, name);
        toast.success('Account created successfully!');
      } else {
        response = await apiClient.login(email, password);
        toast.success('Logged in successfully!');
      }

      setAuth(response.user, response.access_token);
      router.push('/');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || `${mode === 'signup' ? 'Signup' : 'Login'} failed`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {mode === 'signup' && (
          <div className={styles.inputGroup}>
            <label htmlFor="name" className={styles.label}>
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.input}
              placeholder="John Doe"
              required
            />
          </div>
        )}

        <div className={styles.inputGroup}>
          <label htmlFor="email" className={styles.label}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
            placeholder="you@example.com"
            required
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password" className={styles.label}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            placeholder="••••••••"
            minLength={8}
            required
          />
          {mode === 'signup' && (
            <p className={styles.hint}>Must be at least 8 characters</p>
          )}
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
          className={styles.submitButton}
        >
          {mode === 'signup' ? 'Create Account' : 'Sign In'}
        </Button>
      </form>

      <div className={styles.divider}>
        <span className={styles.dividerText}>or</span>
      </div>

      <GoogleLoginButton />

      <div className={styles.toggleMode}>
        <p className={styles.toggleText}>
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={toggleMode}
            className={styles.toggleButton}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
