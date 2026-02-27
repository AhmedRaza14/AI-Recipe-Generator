import axios, { AxiosInstance, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
      headers: {
        'Content-Type': 'application/json',
      },
    });

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

  async googleAuth(googleToken: string) {
    const response = await this.client.post('/auth/google', {
      token: googleToken,
    });
    return response.data;
  }

  async googleLogin(googleToken: string) {
    return this.googleAuth(googleToken);
  }

  async signup(email: string, password: string, name: string) {
    const response = await this.client.post('/auth/signup', {
      email,
      password,
      name,
    });
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

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

  async sendChatMessage(message: string, context?: any[]) {
    const response = await this.client.post('/chat', {
      message,
      context,
    });
    return response.data;
  }

  async chat(message: string) {
    return this.sendChatMessage(message);
  }

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
