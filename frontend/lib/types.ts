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
  id?: number;
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
  avatar?: string;
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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  response: string;
}
