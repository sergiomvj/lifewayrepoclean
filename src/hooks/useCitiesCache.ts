import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface City {
  id: string;
  name: string;
  state: string;
  region?: string;
  population?: number;
  average_temperature?: any;
  cost_of_living_index?: number;
  job_market_score?: number;
  education_score?: number;
  business_opportunity_score?: number;
  main_destiny: boolean;
  description?: string;
  highlights?: string[];
  [key: string]: any;
}

interface CacheState {
  mainCities: City[];
  allCities: City[];
  isMainCitiesLoaded: boolean;
  isAllCitiesLoaded: boolean;
  isLoadingMain: boolean;
  isLoadingAll: boolean;
  isTransitioning: boolean;
  error: string | null;
  totalMainCount: number;
  totalAllCount: number;
}

interface UseCitiesCacheReturn extends CacheState {
  loadMainCities: () => Promise<void>;
  loadAllCities: () => Promise<void>;
  switchToAllCities: () => Promise<void>;
  switchToMainCities: () => void;
  getCurrentCities: (showAll: boolean) => City[];
  searchCities: (term: string, showAll: boolean) => City[];
  filterByState: (state: string, showAll: boolean) => City[];
  sortCities: (cities: City[], sortBy: string) => City[];
  clearCache: () => void;
}

export const useCitiesCache = (): UseCitiesCacheReturn => {
  const [cache, setCache] = useState<CacheState>({
    mainCities: [],
    allCities: [],
    isMainCitiesLoaded: false,
    isAllCitiesLoaded: false,
    isLoadingMain: false,
    isLoadingAll: false,
    isTransitioning: false,
    error: null,
    totalMainCount: 0,
    totalAllCount: 0,
  });

  // Carregar cidades principais
  const loadMainCities = useCallback(async () => {
    if (cache.isMainCitiesLoaded || cache.isLoadingMain) return;

    setCache(prev => ({ ...prev, isLoadingMain: true, error: null }));

    try {
      // Buscar contagem
      const { count: mainCount, error: countError } = await supabase
        .from('cities')
        .select('*', { count: 'exact', head: true })
        .eq('main_destiny', true);

      if (countError) throw countError;

      // Buscar dados
      const { data: mainData, error: dataError } = await supabase
        .from('cities')
        .select('*')
        .eq('main_destiny', true)
        .order('name');

      if (dataError) throw dataError;

      setCache(prev => ({
        ...prev,
        mainCities: mainData || [],
        isMainCitiesLoaded: true,
        isLoadingMain: false,
        totalMainCount: mainCount || 0,
      }));

      // Pré-carregar todas as cidades em background após 2 segundos
      setTimeout(() => {
        if (!cache.isAllCitiesLoaded && !cache.isLoadingAll) {
          loadAllCities();
        }
      }, 2000);

    } catch (error: any) {
      console.error('Erro ao carregar cidades principais:', error);
      setCache(prev => ({
        ...prev,
        isLoadingMain: false,
        error: error.message || 'Erro ao carregar cidades principais',
      }));
    }
  }, [cache.isMainCitiesLoaded, cache.isLoadingMain, cache.isAllCitiesLoaded, cache.isLoadingAll]);

  // Carregar todas as cidades
  const loadAllCities = useCallback(async () => {
    if (cache.isAllCitiesLoaded || cache.isLoadingAll) return;

    setCache(prev => ({ ...prev, isLoadingAll: true, error: null }));

    try {
      // Buscar contagem
      const { count: allCount, error: countError } = await supabase
        .from('cities')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Buscar dados em lotes para melhor performance
      const BATCH_SIZE = 1000;
      let allCitiesData: City[] = [];
      let from = 0;

      while (true) {
        const { data: batchData, error: batchError } = await supabase
          .from('cities')
          .select('*')
          .order('name')
          .range(from, from + BATCH_SIZE - 1);

        if (batchError) throw batchError;

        if (!batchData || batchData.length === 0) break;

        allCitiesData = [...allCitiesData, ...batchData];
        from += BATCH_SIZE;

        // Se o lote retornou menos que o tamanho esperado, chegamos ao fim
        if (batchData.length < BATCH_SIZE) break;
      }

      setCache(prev => ({
        ...prev,
        allCities: allCitiesData,
        isAllCitiesLoaded: true,
        isLoadingAll: false,
        totalAllCount: allCount || 0,
      }));

    } catch (error: any) {
      console.error('Erro ao carregar todas as cidades:', error);
      setCache(prev => ({
        ...prev,
        isLoadingAll: false,
        error: error.message || 'Erro ao carregar todas as cidades',
      }));
    }
  }, [cache.isAllCitiesLoaded, cache.isLoadingAll]);

  // Alternar para todas as cidades com transição suave
  const switchToAllCities = useCallback(async () => {
    setCache(prev => ({ ...prev, isTransitioning: true }));

    // Se já temos os dados, usar imediatamente
    if (cache.isAllCitiesLoaded) {
      setCache(prev => ({ ...prev, isTransitioning: false }));
      return;
    }

    // Caso contrário, carregar os dados
    await loadAllCities();
    setCache(prev => ({ ...prev, isTransitioning: false }));
  }, [cache.isAllCitiesLoaded, loadAllCities]);

  // Alternar para cidades principais
  const switchToMainCities = useCallback(() => {
    setCache(prev => ({ ...prev, isTransitioning: false }));
  }, []);

  // Obter cidades atuais baseado no modo
  const getCurrentCities = useCallback((showAll: boolean): City[] => {
    return showAll ? cache.allCities : cache.mainCities;
  }, [cache.allCities, cache.mainCities]);

  // Buscar cidades por termo
  const searchCities = useCallback((term: string, showAll: boolean): City[] => {
    const cities = getCurrentCities(showAll);
    if (!term.trim()) return cities;

    const searchTerm = term.toLowerCase();
    return cities.filter(city => 
      city.name.toLowerCase().includes(searchTerm) ||
      city.state.toLowerCase().includes(searchTerm)
    );
  }, [getCurrentCities]);

  // Filtrar por estado
  const filterByState = useCallback((state: string, showAll: boolean): City[] => {
    const cities = getCurrentCities(showAll);
    if (state === 'all') return cities;

    return cities.filter(city => city.state === state);
  }, [getCurrentCities]);

  // Ordenar cidades
  const sortCities = useCallback((cities: City[], sortBy: string): City[] => {
    const sorted = [...cities];

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'population':
          return (b.population || 0) - (a.population || 0);
        case 'cost':
          return (a.cost_of_living_index || 0) - (b.cost_of_living_index || 0);
        case 'education':
          return (b.education_score || 0) - (a.education_score || 0);
        case 'business':
          return (b.business_opportunity_score || 0) - (a.business_opportunity_score || 0);
        case 'employment':
          return (b.job_market_score || 0) - (a.job_market_score || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return sorted;
  }, []);

  // Limpar cache
  const clearCache = useCallback(() => {
    setCache({
      mainCities: [],
      allCities: [],
      isMainCitiesLoaded: false,
      isAllCitiesLoaded: false,
      isLoadingMain: false,
      isLoadingAll: false,
      isTransitioning: false,
      error: null,
      totalMainCount: 0,
      totalAllCount: 0,
    });
  }, []);

  // Estados derivados para facilitar uso
  const isLoading = cache.isLoadingMain || cache.isLoadingAll || cache.isTransitioning;
  const hasData = cache.isMainCitiesLoaded || cache.isAllCitiesLoaded;

  return {
    ...cache,
    loadMainCities,
    loadAllCities,
    switchToAllCities,
    switchToMainCities,
    getCurrentCities,
    searchCities,
    filterByState,
    sortCities,
    clearCache,
  };
};

export default useCitiesCache;
