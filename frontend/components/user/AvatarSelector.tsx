'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { AVATAR_EMOJIS, AVATAR_LABELS } from '@/lib/avatars';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import styles from './AvatarSelector.module.css';

interface AvatarSelectorProps {
  currentAvatar: string;
  onClose: () => void;
  onAvatarChange: (avatar: string) => void;
}

export default function AvatarSelector({ currentAvatar, onClose, onAvatarChange }: AvatarSelectorProps) {
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar);
  const [isLoading, setIsLoading] = useState(false);
  const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);

  useEffect(() => {
    fetchAvatars();
  }, []);

  const fetchAvatars = async () => {
    try {
      const response = await apiClient.getAvailableAvatars();
      setAvailableAvatars(response.avatars);
    } catch (error) {
      console.error('Failed to fetch avatars:', error);
      // Fallback to default avatars
      setAvailableAvatars(Object.keys(AVATAR_EMOJIS));
    }
  };

  const handleSave = async () => {
    if (selectedAvatar === currentAvatar) {
      onClose();
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.updateAvatar(selectedAvatar);
      onAvatarChange(selectedAvatar);
      toast.success('Avatar updated successfully!');
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to update avatar';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Choose Your Avatar</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <XMarkIcon className={styles.closeIcon} />
          </button>
        </div>

        <div className={styles.avatarGrid}>
          {availableAvatars.map((avatar) => (
            <button
              key={avatar}
              onClick={() => setSelectedAvatar(avatar)}
              className={`${styles.avatarOption} ${selectedAvatar === avatar ? styles.selected : ''}`}
            >
              <span className={styles.avatarEmoji}>{AVATAR_EMOJIS[avatar]}</span>
              <span className={styles.avatarLabel}>{AVATAR_LABELS[avatar]}</span>
            </button>
          ))}
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={styles.saveButton}
          >
            {isLoading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
