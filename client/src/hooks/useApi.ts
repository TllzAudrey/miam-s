import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T>(
  apiCall: () => Promise<{ data: T }>,
  dependencies: any[] = []
): UseApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiCall();
      setState({
        data: response.data,
        loading: false,
        error: null,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setState({
        data: null,
        loading: false,
        error: errorMessage,
      });
      console.warn('API call failed:', errorMessage);
    }
  }, [...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch: fetchData,
  };
}

// Hooks spécialisés pour chaque entité
export function useIngredients(params?: any) {
  return useApi(() => apiService.getIngredients(params), [params]);
}

export function useRecipes(params?: any) {
  return useApi(() => apiService.getRecipes(params), [params]);
}

export function useMenus() {
  return useApi(() => apiService.getMenus(), []);
}

export function useShoppingLists() {
  return useApi(() => apiService.getShoppingLists(), []);
}

// Hook pour les mutations (POST, PUT, DELETE)
export function useMutation<T, P = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (
    apiCall: (params: P) => Promise<{ data: T }>,
    params: P
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall(params);
      setLoading(false);
      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  return {
    mutate,
    loading,
    error,
    clearError: () => setError(null),
  };
}

// Hooks de mutation spécialisés
export function useCreateIngredient() {
  const { mutate, loading, error, clearError } = useMutation();
  
  const createIngredient = useCallback(async (ingredient: any) => {
    return mutate(apiService.createIngredient.bind(apiService), ingredient);
  }, [mutate]);

  return { createIngredient, loading, error, clearError };
}

export function useCreateRecipe() {
  const { mutate, loading, error, clearError } = useMutation();
  
  const createRecipe = useCallback(async (recipe: any) => {
    return mutate(apiService.createRecipe.bind(apiService), recipe);
  }, [mutate]);

  return { createRecipe, loading, error, clearError };
}

export function useCreateMenu() {
  const { mutate, loading, error, clearError } = useMutation();
  
  const createMenu = useCallback(async (menu: any) => {
    return mutate(apiService.createMenu.bind(apiService), menu);
  }, [mutate]);

  return { createMenu, loading, error, clearError };
}

export function useGenerateMenu() {
  const { mutate, loading, error, clearError } = useMutation();
  
  const generateMenu = useCallback(async (params: any) => {
    return mutate(apiService.generateRandomMenu.bind(apiService), params);
  }, [mutate]);

  return { generateMenu, loading, error, clearError };
}
