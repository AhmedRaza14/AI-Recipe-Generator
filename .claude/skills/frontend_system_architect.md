---
name: frontend_system_architect
description: Design and implement Next.js 14 frontend with TypeScript, Tailwind CSS, and type-safe API integration
---

When this skill is invoked, create a production-ready Next.js 14 frontend with complete UI components and API integration.

## Step 1: Initialize Next.js Project

```bash
npx create-next-app@latest frontend --typescript --tailwind --app --no-src-dir --import-alias "@/*"
cd frontend
```

## Step 2: Install Dependencies

```bash
npm install axios
npm install @tanstack/react-query
npm install zustand
npm install react-hot-toast
npm install @headlessui/react
npm install @heroicons/react
npm install next-auth
npm install @google/generative-ai
```

## Step 3: Project Structure

```
frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── recipe/
│   │   └── page.tsx            # Recipe generation page
│   ├── ingredients/
│   │   └── page.tsx            # Ingredient-based page
│   ├── saved/
│   │   └── page.tsx            # Saved recipes (protected)
│   └── login/
│       └── page.tsx            # Login page
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Footer.tsx
│   ├── recipe/
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeForm.tsx
│   │   └── RecipeDetail.tsx
│   ├── ingredients/
│   │   ├── IngredientInput.tsx
│   │   └── IngredientTag.tsx
│   ├── chat/
│   │   ├── ChatWidget.tsx
│   │   └── ChatMessage.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Spinner.tsx
│   │   └── Modal.tsx
│   └── auth/
│       └── GoogleLoginButton.tsx
│
├── lib/
│   ├── api.ts                  # API client
│   ├── auth.ts                 # Auth utilities
│   └── types.ts                # TypeScript types
│
├── hooks/
│   ├── useAuth.ts
│   ├── useRecipe.ts
│   └── useChat.ts
│
├── store/
│   └── authStore.ts            # Zustand store
│
├── styles/
│   └── globals.css
│
└── .env.local
```

## Step 4: Create API Client

```typescript
// lib/api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('access_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async googleAuth(googleToken: string) {
    const response = await this.client.post('/auth/google', {
      google_token: googleToken,
    });
    return response.data;
  }

  // Recipe endpoints
  async generateRecipe(dishName: string) {
    const response = await this.client.post('/recipe/generate-recipe', {
      dish_name: dishName,
    });
    return response.data;
  }

  async generateFromIngredients(ingredients: string[]) {
    const response = await this.client.post('/recipe/generate-from-ingredients', {
      ingredients,
    });
    return response.data;
  }

  // Chat endpoint
  async sendChatMessage(message: string, context?: any[]) {
    const response = await this.client.post('/chat', {
      message,
      context,
    });
    return response.data;
  }

  // Saved recipes endpoints
  async saveRecipe(recipeData: any) {
    const response = await this.client.post('/saved/save-recipe', {
      recipe_data: recipeData,
    });
    return response.data;
  }

  async getSavedRecipes() {
    const response = await this.client.get('/saved/recipes');
    return response.data;
  }

  async deleteSavedRecipe(recipeId: number) {
    const response = await this.client.delete(`/saved/recipes/${recipeId}`);
    return response.data;
  }
}

export const apiClient = new APIClient();
```

## Step 5: Create TypeScript Types

```typescript
// lib/types.ts
export interface Ingredient {
  name: string;
  quantity: string;
}

export interface Nutrition {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  ingredients: Ingredient[];
  steps: string[];
  nutrition: Nutrition;
  tips: string[];
  serving_suggestions: string[];
}

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SavedRecipe {
  id: number;
  user_id: number;
  recipe_json: Recipe;
  created_at: string;
}
```

## Step 6: Create Auth Store (Zustand)

```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('access_token', token);
        set({ user, token, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

## Step 7: Create Recipe Card Component

```typescript
// components/recipe/RecipeCard.tsx
import { Recipe } from '@/lib/types';
import { ClockIcon, FireIcon } from '@heroicons/react/24/outline';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: () => void;
  showSaveButton?: boolean;
}

export default function RecipeCard({
  recipe,
  onSave,
  showSaveButton = true
}: RecipeCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        {recipe.title}
      </h2>

      <p className="text-gray-600 mb-4">{recipe.description}</p>

      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <ClockIcon className="w-5 h-5" />
          <span>Prep: {recipe.prep_time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FireIcon className="w-5 h-5" />
          <span>Cook: {recipe.cook_time}</span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Ingredients:</h3>
        <ul className="list-disc list-inside space-y-1">
          {recipe.ingredients.map((ing, idx) => (
            <li key={idx} className="text-gray-700">
              {ing.quantity} {ing.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2">
          {recipe.steps.map((step, idx) => (
            <li key={idx} className="text-gray-700">
              {step}
            </li>
          ))}
        </ol>
      </div>

      <div className="mb-4 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold text-gray-800 mb-2">Nutrition:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div>
            <span className="text-gray-600">Calories:</span>
            <span className="ml-2 font-medium">{recipe.nutrition.calories}</span>
          </div>
          <div>
            <span className="text-gray-600">Protein:</span>
            <span className="ml-2 font-medium">{recipe.nutrition.protein}</span>
          </div>
          <div>
            <span className="text-gray-600">Carbs:</span>
            <span className="ml-2 font-medium">{recipe.nutrition.carbs}</span>
          </div>
          <div>
            <span className="text-gray-600">Fat:</span>
            <span className="ml-2 font-medium">{recipe.nutrition.fat}</span>
          </div>
        </div>
      </div>

      {recipe.tips.length > 0 && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-800 mb-2">Tips:</h3>
          <ul className="list-disc list-inside space-y-1">
            {recipe.tips.map((tip, idx) => (
              <li key={idx} className="text-gray-700 text-sm">
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showSaveButton && onSave && (
        <button
          onClick={onSave}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Recipe
        </button>
      )}
    </div>
  );
}
```

## Step 8: Create Google Login Button

```typescript
// components/auth/GoogleLoginButton.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'react-hot-toast';

declare global {
  interface Window {
    google: any;
  }
}

export default function GoogleLoginButton() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { theme: 'outline', size: 'large', width: 300 }
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      const data = await apiClient.googleAuth(response.credential);
      setAuth(data.user, data.access_token);
      toast.success('Logged in successfully!');
      router.push('/');
    } catch (error) {
      toast.error('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  };

  return <div id="googleSignInButton"></div>;
}
```

## Step 9: Create Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Step 10: Create Root Layout

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Recipe Generator',
  description: 'Generate delicious recipes with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
```

## Design Principles

1. **Type Safety:** Full TypeScript coverage
2. **Component Reusability:** Modular UI components
3. **State Management:** Zustand for global state
4. **API Integration:** Centralized API client with interceptors
5. **Error Handling:** Toast notifications for user feedback
6. **Responsive Design:** Mobile-first with Tailwind CSS
7. **Authentication:** Secure token storage and protected routes
8. **Performance:** React Query for caching and optimistic updates

Implement this frontend architecture with proper error boundaries and loading states.
