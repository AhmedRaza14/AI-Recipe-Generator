'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    router.push('/login');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.navContent}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>🍳</span>
            AI Recipe Maker
          </Link>

          <div className={styles.navLinks}>
            <Link href="/recipe" className={styles.navLink}>
              Recipe
            </Link>
            <Link href="/ingredients" className={styles.navLink}>
              Ingredients
            </Link>
            {isAuthenticated && (
              <Link href="/saved" className={styles.navLink}>
                Saved
              </Link>
            )}
            {isAuthenticated ? (
              <div className={styles.userSection} ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className={styles.userBadge}
                >
                  <UserCircleIcon className={styles.userIcon} />
                  <span className={styles.userName}>{user?.name}</span>
                </button>

                {isDropdownOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropdownHeader}>
                      <div className={styles.dropdownName}>{user?.name}</div>
                      <div className={styles.dropdownEmail}>{user?.email}</div>
                    </div>
                    <div className={styles.dropdownDivider}></div>
                    <button
                      onClick={handleLogout}
                      className={styles.dropdownLogout}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={styles.signInButton}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
