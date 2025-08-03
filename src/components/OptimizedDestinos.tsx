import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, 
  Users, 
  DollarSign, 
  Thermometer, 
  Search, 
  Filter, 
  TrendingUp, 
  GraduationCap, 
  Briefcase, 
  Building2, 
  Info,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useCitiesCache } from '../hooks/useCitiesCache';
import { useDebounce } from '../hooks/useDebounce';

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

// Função auxiliar para extrair dados de temperatura
const getTemperatureData = (city: City) => {
  if (city.average_temperature && typeof city.average_temperature === 'string') {
    try {
      const tempData = JSON.parse(city.average_temperature);
      if (tempData.celsius && tempData.fahrenheit) {
        return {
          celsius: parseFloat(tempData.celsius),
          fahrenheit: parseFloat(tempData.fahrenheit)
        };
      }
    } catch (error) {
      console.error('Erro ao parsear temperatura:', error);
    }
  }
  
  // Fallback para outros formatos
  const celsius = city.celsius || city.temp_celsius || city.temperature || city.avg_temp;
  const fahrenheit = city.fahrenheit || city.temp_fahrenheit;
  
  if (celsius) {
    return {
      celsius: parseFloat(celsius),
      fahrenheit: fahrenheit ? parseFloat(fahrenheit) : (parseFloat(celsius) * 9/5) + 32
    };
  }
  
  return null;
};

const OptimizedDestinos: React.FC = () => {
  const {
    mainCities,
    allCities,
    isMainCitiesLoaded,
    isAllCitiesLoaded,
    isLoadingMain,
    isLoadingAll,
    isTransitioning,
    error,
    totalMainCount,
    totalAllCount,
    loadMainCities,
    switchToAllCities,
    switchToMainCities,
    getCurrentCities,
    searchCities,
    filterByState,
    sortCities
  } = useCitiesCache();

  const [showAllCities, setShowAllCities] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Debounce da busca para melhor performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Carregar cidades principais na inicialização
  useEffect(() => {
    loadMainCities();
  }, [loadMainCities]);

  // Processar cidades com filtros e ordenação
  const processedCities = useMemo(() => {
    let cities = getCurrentCities(showAllCities);

    // Aplicar busca
    if (debouncedSearchTerm.trim()) {
      cities = searchCities(debouncedSearchTerm, showAllCities);
    }

    // Aplicar filtro de estado
    if (selectedState !== 'all') {
      cities = filterByState(selectedState, showAllCities);
    }

    // Aplicar ordenação
    cities = sortCities(cities, sortBy);

    return cities;
  }, [
    showAllCities,
    debouncedSearchTerm,
    selectedState,
    sortBy,
    getCurrentCities,
    searchCities,
    filterByState,
    sortCities
  ]);

  // Obter estados únicos das cidades atuais
  const uniqueStates = useMemo(() => {
    const cities = getCurrentCities(showAllCities);
    return Array.from(new Set(cities.map(city => city.state))).sort();
  }, [getCurrentCities, showAllCities]);

  // Função para alternar entre datasets
  const handleToggleDataset = async () => {
    if (!showAllCities) {
      // Mudando para "todas as cidades"
      setShowAllCities(true);
      await switchToAllCities();
    } else {
      // Mudando para "principais"
      setShowAllCities(false);
      switchToMainCities();
    }
  };

  // Função para obter URL da imagem da cidade
  const getCityImageUrl = (cityId: string, isMainCity: boolean = true) => {
    const folder = isMainCity ? 'maincities' : 'cities';
    return `/storage/images/${folder}/${cityId}.jpg`;
  };

  // Função para formatar população
  const formatPopulation = (population?: number) => {
    if (!population) return 'N/A';
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    }
    if (population >= 1000) {
      return `${(population / 1000).toFixed(0)}K`;
    }
    return population.toString();
  };

  // Estados de loading
  const isInitialLoading = isLoadingMain && !isMainCitiesLoaded;
  const isDatasetSwitching = isTransitioning || (showAllCities && isLoadingAll && !isAllCitiesLoaded);
  const hasData = showAllCities ? isAllCitiesLoaded : isMainCitiesLoaded;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Destinos nos EUA</h1>
              <p className="text-gray-600 mt-1">
                Explore as melhores cidades para sua jornada de imigração
              </p>
            </div>
            
            {/* Estatísticas */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {showAllCities ? totalAllCount : totalMainCount}
                </div>
                <div className="text-sm text-gray-500">
                  {showAllCities ? 'Total de cidades' : 'Principais destinos'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          {/* Linha 1: Busca e Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por cidade ou estado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por Estado */}
            <Select value={selectedState} onValueChange={setSelectedState}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                {uniqueStates.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nome (A-Z)</SelectItem>
                <SelectItem value="population">População</SelectItem>
                <SelectItem value="cost">Custo de Vida</SelectItem>
                <SelectItem value="education">Qualidade de Ensino</SelectItem>
                <SelectItem value="business">Oportunidade de Negócios</SelectItem>
                <SelectItem value="employment">Empregabilidade</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Linha 2: Botões de Ação */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Dataset */}
            <Button
              onClick={handleToggleDataset}
              variant={showAllCities ? "default" : "outline"}
              disabled={isDatasetSwitching}
              className="flex items-center gap-2"
            >
              {isDatasetSwitching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
              {showAllCities ? 'Principais Destinos' : 'Ver Todas'}
            </Button>

            {/* Indicador de Status */}
            {isDatasetSwitching && (
              <div className="flex items-center gap-2 text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Carregando cidades...</span>
              </div>
            )}

            {/* Info sobre dataset atual */}
            <div className="flex items-center gap-2 text-gray-600">
              <Info className="h-4 w-4" />
              <span className="text-sm">
                Exibindo {processedCities.length} de {showAllCities ? totalAllCount : totalMainCount} cidades
                {debouncedSearchTerm && ` (filtradas por "${debouncedSearchTerm}")`}
              </span>
            </div>
          </div>
        </div>

        {/* Loading States */}
        {isInitialLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Carregando destinos...
              </h3>
              <p className="text-gray-600">
                Buscando as melhores cidades para você
              </p>
            </div>
          </div>
        )}

        {/* Erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <Info className="h-4 w-4" />
              <span className="font-medium">Erro ao carregar cidades:</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </div>
        )}

        {/* Grid de Cidades */}
        {hasData && !isInitialLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedCities.map((city) => {
              const tempData = getTemperatureData(city);
              
              return (
                <Card 
                  key={city.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-300"
                >
                  {/* Imagem da cidade */}
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={getCityImageUrl(city.id, city.main_destiny)}
                      alt={`${city.name}, ${city.state}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/storage/images/placeholder-city.jpg';
                      }}
                    />
                    
                    {/* Overlay com informações */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Temperatura no canto superior direito */}
                    {tempData && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                        <div className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-medium text-gray-900">
                            {Math.round(tempData.celsius)}°C
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Nome da cidade no canto inferior */}
                    <div className="absolute bottom-3 left-3 text-white">
                      <h3 className="font-bold text-lg leading-tight">{city.name}</h3>
                      <p className="text-sm opacity-90">{city.state}</p>
                    </div>
                  </div>

                  <CardHeader className="pb-3">
                    {/* População */}
                    {city.population && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Users className="w-4 h-4" />
                        <span>{formatPopulation(city.population)} habitantes</span>
                      </div>
                    )}

                    {/* Descrição */}
                    {city.description && (
                      <CardDescription className="text-gray-600 leading-relaxed text-sm">
                        {city.description.length > 100 
                          ? `${city.description.substring(0, 100)}...` 
                          : city.description
                        }
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Índices de Avaliação */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {city.cost_of_living_index && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-3 h-3 text-blue-600" />
                              <span className="text-xs font-medium text-gray-700">Custo</span>
                            </div>
                            <span className="text-sm font-semibold text-blue-600">
                              {city.cost_of_living_index}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 text-center">Média = 1</div>
                        </div>
                      )}
                      
                      {city.job_market_score && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <Briefcase className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-medium text-gray-700">Emprego</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">
                              {city.job_market_score}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 text-center">Média = 1</div>
                        </div>
                      )}
                      
                      {city.education_score && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <GraduationCap className="w-3 h-3 text-purple-600" />
                              <span className="text-xs font-medium text-gray-700">Ensino</span>
                            </div>
                            <span className="text-sm font-semibold text-purple-600">
                              {city.education_score}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 text-center">Média = 1</div>
                        </div>
                      )}
                      
                      {city.business_opportunity_score && (
                        <div className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center space-x-1">
                              <Building2 className="w-3 h-3 text-orange-600" />
                              <span className="text-xs font-medium text-gray-700">Negócios</span>
                            </div>
                            <span className="text-sm font-semibold text-orange-600">
                              {city.business_opportunity_score}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 text-center">Média = 1</div>
                        </div>
                      )}
                    </div>

                    {/* Highlights */}
                    {city.highlights && city.highlights.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {city.highlights.slice(0, 2).map((highlight, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {highlight}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Botão Ver Detalhes */}
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        setSelectedCity(city);
                        setShowDetailsModal(true);
                      }}
                    >
                      Ver Detalhes
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {hasData && !isInitialLoading && processedCities.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma cidade encontrada
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou termo de busca
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizedDestinos;
