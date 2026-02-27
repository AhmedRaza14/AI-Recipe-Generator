'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import AuthForm from '@/components/auth/AuthForm';
import styles from './page.module.css';

export default function LoginPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.icon}>🍳</div>
          <h1 className={styles.title}>
            Welcome Back
          </h1>
          <p className={styles.subtitle}>
            Sign in to save and manage your recipes
          </p>
        </div>

        <div className={styles.card}>
          <AuthForm mode="login" />

          <div className={styles.terms}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
