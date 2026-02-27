'use client';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';
import styles from './ChatWidget.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await apiClient.chat(inputValue.trim());
      const assistantMessage: Message = { role: 'assistant', content: response.response };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      toast.error('Failed to get response');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={styles.chatButton}
        >
          <ChatBubbleLeftRightIcon className={styles.chatButtonIcon} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className={styles.chatWindow}>
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.avatar}>
                <span className={styles.avatarText}>AI</span>
              </div>
              <div>
                <h3 className={styles.headerTitle}>Recipe Assistant</h3>
                <p className={styles.headerSubtitle}>Ask me anything about cooking</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={styles.closeButton}
            >
              <XMarkIcon className={styles.closeIcon} />
            </button>
          </div>

          {/* Messages */}
          <div className={styles.messages}>
            {messages.length === 0 && (
              <div className={styles.emptyState}>
                <ChatBubbleLeftRightIcon className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>Start a conversation!</p>
                <p className={styles.emptySubtitle}>Ask about recipes, cooking tips, or ingredients</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`${styles.messageRow} ${message.role === 'user' ? styles.messageRowUser : styles.messageRowAssistant}`}
              >
                <div
                  className={`${styles.messageBubble} ${
                    message.role === 'user'
                      ? styles.messageBubbleUser
                      : styles.messageBubbleAssistant
                  }`}
                >
                  <p className={styles.messageText}>{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className={styles.loadingRow}>
                <div className={styles.loadingBubble}>
                  <div className={styles.loadingDots}>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className={styles.inputContainer}>
            <div className={styles.inputRow}>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className={styles.input}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() || isLoading}
                className={styles.sendButton}
              >
                <PaperAirplaneIcon className={styles.sendIcon} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
