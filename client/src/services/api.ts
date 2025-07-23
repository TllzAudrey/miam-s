const API_BASE_URL = window.location.hostname === 'localhost' 
  ? '/api' 
  : 'https://your-production-url.com/api';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    current: number;
    total: number;
    limit: number;
    totalCount: number;
  };
}

interface ApiError {
  message: string;
  errors?: any[];
}

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        // Vérifier si la réponse est du JSON valide
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData: ApiError = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } else {
          // Si ce n'est pas du JSON, c'est probablement une erreur de proxy
          throw new Error(`Erreur de connexion au serveur (${response.status})`);
        }
      }

      // Vérifier si la réponse de succès est du JSON valide
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        throw new Error('Réponse du serveur invalide (pas de JSON)');
      }
    } catch (error) {
      console.error(`API Error for ${endpoint}:`, error);
      
      // Si c'est une erreur de réseau ou de proxy
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré.');
      }
      
      throw error;
    }
  }

  // ===== INGREDIENTS =====
  
  async getIngredients(params?: {
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/ingredients${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>(endpoint);
  }

  async getIngredientById(id: string) {
    return this.request<any>(`/ingredients/${id}`);
  }

  async createIngredient(ingredient: any) {
    return this.request<any>('/ingredients', {
      method: 'POST',
      body: JSON.stringify(ingredient),
    });
  }

  async updateIngredient(id: string, ingredient: any) {
    return this.request<any>(`/ingredients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(ingredient),
    });
  }

  async deleteIngredient(id: string) {
    return this.request<any>(`/ingredients/${id}`, {
      method: 'DELETE',
    });
  }

  async createBulkIngredients(ingredients: any[]) {
    return this.request<any[]>('/ingredients/bulk', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    });
  }

  async getCategoryStats() {
    return this.request<any>('/ingredients/categories/stats');
  }

  // ===== RECIPES =====

  async getRecipes(params?: {
    search?: string;
    category?: string;
    difficulty?: string;
    maxPrepTime?: number;
    maxCookTime?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/recipes${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return this.request<any[]>(endpoint);
  }

  async getRecipeById(id: string) {
    return this.request<any>(`/recipes/${id}`);
  }

  async createRecipe(recipe: any) {
    return this.request<any>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  async updateRecipe(id: string, recipe: any) {
    return this.request<any>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipe),
    });
  }

  async deleteRecipe(id: string) {
    return this.request<any>(`/recipes/${id}`, {
      method: 'DELETE',
    });
  }

  async getRandomRecipe() {
    return this.request<any>('/recipes/random');
  }

  async rateRecipe(id: string, rating: number) {
    return this.request<any>(`/recipes/${id}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  }

  async scaleRecipe(id: string, newServings: number) {
    return this.request<any>(`/recipes/${id}/scale`, {
      method: 'POST',
      body: JSON.stringify({ newServings }),
    });
  }

  // ===== MENUS =====

  async getMenus() {
    return this.request<any[]>('/menus');
  }

  async getMenuById(id: string) {
    return this.request<any>(`/menus/${id}`);
  }

  async createMenu(menu: any) {
    return this.request<any>('/menus', {
      method: 'POST',
      body: JSON.stringify(menu),
    });
  }

  async generateRandomMenu(params: {
    startDate: string;
    endDate: string;
    mealsPerDay?: string[];
    dietaryRestrictions?: string[];
    maxBudget?: number;
  }) {
    return this.request<any>('/menus/generate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async generateShoppingList(menuId: string) {
    return this.request<any>(`/menus/${menuId}/shopping-list`, {
      method: 'POST',
    });
  }

  async getMenuNutrition(id: string) {
    return this.request<any>(`/menus/${id}/nutrition`);
  }

  // ===== SHOPPING LISTS =====

  async getShoppingLists() {
    return this.request<any[]>('/shopping');
  }

  async getShoppingListById(id: string) {
    return this.request<any>(`/shopping/${id}`);
  }

  async createShoppingList(shoppingList: any) {
    return this.request<any>('/shopping', {
      method: 'POST',
      body: JSON.stringify(shoppingList),
    });
  }

  async toggleShoppingItem(listId: string, itemId: string) {
    return this.request<any>(`/shopping/${listId}/items/${itemId}/toggle`, {
      method: 'PUT',
    });
  }

  async optimizeShoppingList(id: string) {
    return this.request<any>(`/shopping/${id}/optimize`, {
      method: 'PUT',
    });
  }

  async exportShoppingList(id: string, format: 'pdf' | 'text') {
    return this.request<any>(`/shopping/${id}/export`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });
  }
}

export const apiService = new ApiService();
export default apiService;
