---
name: integration_orchestrator
description: Connect frontend and backend, implement end-to-end flows, and ensure seamless integration
---

When this skill is invoked, integrate frontend and backend systems and implement complete user flows.

## Step 1: Configure CORS in Backend

```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://yourapp.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Step 2: Implement Complete Recipe Generation Flow

### Backend Router
```python
# app/routers/recipe.py
from fastapi import APIRouter, HTTPException, Depends
from app.services.ai_service import ai_service
from app.schemas.recipe import RecipeRequest, RecipeResponse

router = APIRouter()

@router.post("/generate-recipe", response_model=RecipeResponse)
async def generate_recipe(request: RecipeRequest):
    """Generate recipe from dish name"""
    try:
        recipe = await ai_service.generate_recipe(request.dish_name)
        return recipe
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Recipe generation failed")
```

### Frontend Hook
```typescript
// hooks/useRecipe.ts
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useGenerateRecipe() {
  return useMutation({
    mutationFn: (dishName: string) => apiClient.generateRecipe(dishName),
    onSuccess: () => {
      toast.success('Recipe generated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to generate recipe');
    },
  });
}
```

### Frontend Page
```typescript
// app/recipe/page.tsx
'use client';

import { useState } from 'react';
import { useGenerateRecipe } from '@/hooks/useRecipe';
import RecipeCard from '@/components/recipe/RecipeCard';
import Spinner from '@/components/ui/Spinner';

export default function RecipePage() {
  const [dishName, setDishName] = useState('');
  const { mutate, data, isLoading } = useGenerateRecipe();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dishName.trim()) {
      mutate(dishName);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Generate Recipe</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="Enter dish name (e.g., Chicken Biryani)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="flex justify-center">
          <Spinner />
        </div>
      )}

      {data && <RecipeCard recipe={data} />}
    </div>
  );
}
```

## Step 3: Implement Authentication Flow

### Backend
```python
# app/routers/auth.py
from fastapi import APIRouter, HTTPException, status
from app.services.auth_service import AuthService
from app.schemas.auth import GoogleAuthRequest, TokenResponse

router = APIRouter()

@router.post("/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Authenticate with Google OAuth"""
    auth_service = AuthService(db)
    try:
        return await auth_service.authenticate_google(request.google_token)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
```

### Frontend
```typescript
// app/login/page.tsx
'use client';

import GoogleLoginButton from '@/components/auth/GoogleLoginButton';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Sign in to AI Recipe Generator
        </h1>
        <GoogleLoginButton />
      </div>
    </div>
  );
}
```

## Step 4: Implement Protected Routes

### Backend Middleware
```python
# app/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Verify JWT and return current user"""
    token = credentials.credentials
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user_repo = UserRepository(db)
    user = user_repo.get_by_email(payload.get("email"))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
```

### Frontend Protected Route
```typescript
// app/saved/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export default function SavedRecipesPage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['savedRecipes'],
    queryFn: () => apiClient.getSavedRecipes(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Saved Recipes</h1>
      {/* Render saved recipes */}
    </div>
  );
}
```

## Step 5: Implement Save Recipe Flow

### Backend
```python
# app/routers/saved.py
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user
from app.repositories.recipe_repository import RecipeRepository

router = APIRouter()

@router.post("/save-recipe")
async def save_recipe(
    recipe_data: dict,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save recipe for authenticated user"""
    recipe_repo = RecipeRepository(db)
    saved = recipe_repo.create({
        'user_id': current_user.id,
        'recipe_json': recipe_data
    })
    return {"id": saved.id, "message": "Recipe saved successfully"}

@router.get("/recipes")
async def get_saved_recipes(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all saved recipes for user"""
    recipe_repo = RecipeRepository(db)
    recipes = recipe_repo.get_by_user_id(current_user.id)
    return recipes

@router.delete("/recipes/{recipe_id}")
async def delete_recipe(
    recipe_id: int,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete saved recipe"""
    recipe_repo = RecipeRepository(db)
    success = recipe_repo.delete(recipe_id, current_user.id)

    if not success:
        raise HTTPException(status_code=404, detail="Recipe not found")

    return {"message": "Recipe deleted successfully"}
```

### Frontend
```typescript
// hooks/useSaveRecipe.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function useSaveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeData: any) => apiClient.saveRecipe(recipeData),
    onSuccess: () => {
      toast.success('Recipe saved!');
      queryClient.invalidateQueries({ queryKey: ['savedRecipes'] });
    },
    onError: () => {
      toast.error('Failed to save recipe');
    },
  });
}
```

## Step 6: Implement Chat Widget

### Backend
```python
# app/routers/chat.py
from fastapi import APIRouter
from app.services.ai_service import ai_service
from app.schemas.chat import ChatRequest, ChatResponse

router = APIRouter()

@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Handle cooking-related chat queries"""
    try:
        response = await ai_service.chat_response(
            request.message,
            request.context
        )
        return {"response": response}
    except ValueError as e:
        return {"response": str(e)}
```

### Frontend
```typescript
// components/chat/ChatWidget.tsx
'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.sendChatMessage(input, messages);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: response.response },
      ]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl w-96 h-[500px] flex flex-col">
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
            <h3 className="font-semibold">Cooking Assistant</h3>
            <button onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`${
                  msg.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-gray-500">Typing...</div>}
          </div>

          <div className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about cooking..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendMessage}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700"
        >
          💬
        </button>
      )}
    </div>
  );
}
```

## Integration Checklist

- [ ] CORS configured correctly
- [ ] API endpoints match frontend calls
- [ ] Authentication flow working end-to-end
- [ ] Protected routes require valid JWT
- [ ] Error handling on both sides
- [ ] Loading states implemented
- [ ] Toast notifications for user feedback
- [ ] Environment variables configured
- [ ] API client interceptors working
- [ ] Type safety maintained throughout

Test all flows thoroughly before deployment.
