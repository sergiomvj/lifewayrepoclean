import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Users, DollarSign, Thermometer, Search, Filter, TrendingUp, GraduationCap, Briefcase, Building2, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface City {
  id: string;
  name: string;
  state: string;
  region?: string;
  population?: number;
  // Possíveis estruturas de temperatura no banco
  average_temperature?: any; // Pode ser objeto, número, string, etc.
  celsius?: any;
  fahrenheit?: any;
  temp_celsius?: any;
  temp_fahrenheit?: any;
  temperature?: any;
  avg_temp?: any;
  cost_of_living_index?: number;
  job_market_score?: number;
  education_score?: number;
  business_opportunity_score?: number;
  job_opportunities?: string;
  main_destiny: boolean;
  description?: string;
  highlights?: string[];
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Permite qualquer campo adicional
}

// Função auxiliar para extrair dados de temperatura
const getTemperatureData = (city: City) => {
  
  // 1. Verificar average_temperature como string JSON (formato principal do banco)
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
      // Falha silenciosa no parse, continua para próximas verificações
    }
  }
  
  // 2. Verificar average_temperature como objeto
  if (city.average_temperature && typeof city.average_temperature === 'object') {
    if (city.average_temperature.celsius && city.average_temperature.fahrenheit) {
      return {
        celsius: parseFloat(city.average_temperature.celsius),
        fahrenheit: parseFloat(city.average_temperature.fahrenheit)
      };
    }
  }
  
  // 3. Verificar campos separados
  if (city.celsius && city.fahrenheit) {
    return {
      celsius: parseFloat(city.celsius),
      fahrenheit: parseFloat(city.fahrenheit)
    };
  }
  
  // 4. Verificar average_temperature como número
  if (city.average_temperature && typeof city.average_temperature === 'number') {
    return {
      celsius: city.average_temperature,
      fahrenheit: Math.round((city.average_temperature * 9/5) + 32)
    };
  }
  
  return null;
};

const DestinosIndex = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [filteredCities, setFilteredCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const ITEMS_PER_PAGE = 1000;

  // Buscar cidades do Supabase com paginação e filtros
  useEffect(() => {
    const fetchCities = async () => {
      try {
        setLoading(true);
        setCurrentPage(0);
        setCities([]);
        
        // Construir query base
        let query = supabase.from('cities').select('*');
        let countQuery = supabase.from('cities').select('*', { count: 'exact', head: true });
        
        // Aplicar filtros na query
        if (!showAllCities) {
          query = query.eq('main_destiny', true);
          countQuery = countQuery.eq('main_destiny', true);
        }
        
        // Aplicar filtro de estado se selecionado
        if (selectedState !== 'all') {
          query = query.eq('state', selectedState);
          countQuery = countQuery.eq('state', selectedState);
        }
        
        // Aplicar busca por texto se houver
        if (searchTerm.trim()) {
          const searchFilter = `name.ilike.%${searchTerm}%,state.ilike.%${searchTerm}%`;
          query = query.or(searchFilter);
          countQuery = countQuery.or(searchFilter);
        }
        
        // Buscar contagem total primeiro
        const { count, error: countError } = await countQuery;
        
        if (countError) {
          console.error('Erro ao contar cidades:', countError);
          return;
        }
        
        setTotalCount(count || 0);
        setHasMore((count || 0) > ITEMS_PER_PAGE);
        
        // Buscar primeira página de dados
        const { data, error } = await query
          .order('name')
          .range(0, ITEMS_PER_PAGE - 1);

        if (error) {
          console.error('Erro ao buscar cidades:', error);
          return;
        }

        setCities(data || []);
      } catch (error) {
        console.error('Erro na consulta:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [showAllCities, selectedState, searchTerm]);

  // Ordenar cidades (filtros já aplicados na query do Supabase)
  useEffect(() => {
    let sorted = [...cities];

    // Ordenar
    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'population':
          return (b.population || 0) - (a.population || 0);
        case 'cost':
          return (a.cost_of_living_index || 0) - (b.cost_of_living_index || 0);
        case 'education':
          return (b.education_quality_index || 0) - (a.education_quality_index || 0);
        case 'business':
          return (b.business_opportunity_index || 0) - (a.business_opportunity_index || 0);
        case 'employment':
          return (b.employability_index || 0) - (a.employability_index || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredCities(sorted);
  }, [cities, sortBy]);

  // Obter estados únicos
  const uniqueStates = Array.from(new Set(cities.map(city => city.state))).sort();

  // Função para obter URL da imagem da cidade
  const getCityImageUrl = (cityId: string, isMainCity: boolean = true) => {
    const folder = isMainCity ? 'maincities' : 'cities';
    return `/storage/images/${folder}/${cityId}.jpg`;
  };

  // Função para formatar população
  const formatPopulation = (population: number) => {
    if (population >= 1000000) {
      return `${(population / 1000000).toFixed(1)}M`;
    } else if (population >= 1000) {
      return `${(population / 1000).toFixed(0)}K`;
    }
    return population.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-cinza-claro flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo mx-auto mb-4"></div>
          <p className="text-petroleo font-medium">Carregando destinos principais...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-baskerville font-bold text-petroleo mb-4">
            Destinos Principais
          </h1>
          <p className="text-lg text-gray-600 font-figtree max-w-2xl mx-auto">
            Descubra as melhores cidades americanas para começar sua nova vida. 
            Explore oportunidades, custos de vida e qualidade de vida.
          </p>
          

        </div>

        {/* Filtros */}
        <section className="py-8 bg-white/50 backdrop-blur-sm rounded-lg border mb-8">
          <div className="px-6">
            {/* Primeira linha: Busca, Estado e Ordenação */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar cidade ou estado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filtro por Estado */}
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os Estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Estados</SelectItem>
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
                  <SelectItem value="name">Nome</SelectItem>
                  <SelectItem value="population">População</SelectItem>
                  <SelectItem value="cost">Custo</SelectItem>
                  <SelectItem value="education">Ensino</SelectItem>
                  <SelectItem value="business">Negócios</SelectItem>
                  <SelectItem value="employment">Emprego</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Segunda linha: Botões de ação */}
            <div className="grid grid-cols-2 gap-4">
              {/* Botão Ver Todas */}
              <Button 
                variant={showAllCities ? "default" : "outline"}
                onClick={() => setShowAllCities(!showAllCities)}
                className="w-full"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {showAllCities ? 'Principais' : 'Ver Todas'}
              </Button>

              {/* Botão Limpar Filtros */}
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedState('all');
                  setSortBy('name');
                }}
                className="w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </section>

        {/* Lista de Cidades */}
        <div className="max-w-7xl mx-auto">
          {filteredCities.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Nenhuma cidade encontrada
              </h3>
              <p className="text-gray-500">
                Tente ajustar seus filtros para encontrar mais resultados.
              </p>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <p className="text-gray-600">
                  Exibindo <span className="font-semibold text-petroleo">{filteredCities.length}</span> 
                  {totalCount > filteredCities.length ? ` de ${totalCount}` : ''}
                  {showAllCities ? ' cidades' : ' cidades principais'}
                  {hasMore && (
                    <span className="block text-sm text-gray-500 mt-1">
                      (Carregando primeiros {ITEMS_PER_PAGE} resultados)
                    </span>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCities.map((city) => (
                  <Card key={city.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1">
                    {/* Imagem da Cidade */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={getCityImageUrl(city.id, !showAllCities)}
                        alt={city.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/storage/images/cities/default-city.jpg';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-4 left-4">
                        {city.region && (
                          <Badge className="bg-white/90 text-petroleo border-0">
                            {city.region}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-xl font-baskerville text-petroleo group-hover:text-lilas transition-colors">
                          {city.name}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {city.state}
                        </Badge>
                      </div>
                      
                      {/* População e Temperatura */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        {city.population && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3 text-petroleo" />
                            <span className="text-xs text-gray-600 mr-1">Habitantes:</span>
                            <span className="text-xs text-gray-600">
                              {formatPopulation(city.population)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Thermometer className="w-3 h-3 text-petroleo" />
                          <span className="text-xs text-gray-600 mr-1">Temp Média:</span>
                          <span className="text-xs text-gray-600">
                            {(() => {
                              const tempData = getTemperatureData(city);
                              return tempData ? 
                                `${tempData.celsius}°C` : 
                                'Não disponível';
                            })()
                            }
                          </span>
                        </div>
                      </div>

                      {/* Descrição limitada a 150 caracteres */}
                      {city.description && (
                        <CardDescription className="text-gray-600 leading-relaxed text-sm">
                          {city.description.length > 150 
                            ? `${city.description.substring(0, 150)}...` 
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
                                <DollarSign className="w-3 h-3 text-petroleo" />
                                <span className="text-xs font-medium text-gray-700">Custo de Vida</span>
                              </div>
                              <span className="text-sm font-semibold text-petroleo">
                                {city.cost_of_living_index}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 text-center">Média nacional = 1</div>
                          </div>
                        )}
                        {city.job_market_score && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1">
                                <Briefcase className="w-3 h-3 text-petroleo" />
                                <span className="text-xs font-medium text-gray-700">Empregabilidade</span>
                              </div>
                              <span className="text-sm font-semibold text-petroleo">
                                {city.job_market_score}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 text-center">Média nacional = 1</div>
                          </div>
                        )}
                        {city.education_score && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1">
                                <GraduationCap className="w-3 h-3 text-petroleo" />
                                <span className="text-xs font-medium text-gray-700">Ensino</span>
                              </div>
                              <span className="text-sm font-semibold text-petroleo">
                                {city.education_score}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 text-center">Média nacional = 1</div>
                          </div>
                        )}
                        {city.business_opportunity_score && (
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center space-x-1">
                                <Building2 className="w-3 h-3 text-petroleo" />
                                <span className="text-xs font-medium text-gray-700">Negócios</span>
                              </div>
                              <span className="text-sm font-semibold text-petroleo">
                                {city.business_opportunity_score}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 text-center">Média nacional = 1</div>
                          </div>
                        )}
                      </div>

                      {/* Highlights */}
                      {city.highlights && city.highlights.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {city.highlights.slice(0, 3).map((highlight, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {highlight}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Botão Ver Detalhes */}
                      <Button 
                        className="w-full bg-petroleo hover:bg-petroleo/90 text-white group-hover:bg-lilas transition-all"
                        onClick={() => {
                          // Abrir modal com detalhes completos da cidade
                          setSelectedCity(city);
                          setShowDetailsModal(true);
                        }}
                      >
                        Ver Detalhes
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de Detalhes da Cidade */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-baskerville text-petroleo">
              {selectedCity?.name}, {selectedCity?.state}
            </DialogTitle>
          </DialogHeader>
          
          {selectedCity && (
            <div className="space-y-6">
              {/* Foto da Cidade com Overlays */}
              <div className="relative w-full h-64 rounded-lg overflow-hidden">
                {/* Imagem de fundo da cidade */}
                <img
                  src={getCityImageUrl(selectedCity.id, !showAllCities)}
                  alt={selectedCity.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    // Mostrar fallback quando a imagem falhar
                    const fallbackDiv = target.nextElementSibling as HTMLElement;
                    if (fallbackDiv) {
                      fallbackDiv.style.display = 'block';
                    }
                  }}
                />
                {/* Fallback para quando a imagem não carregar */}
                <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 relative" style={{display: 'none'}}>
                  {/* Efeito de cidade no fundo */}
                  <div className="absolute inset-0 bg-black bg-opacity-30"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent"></div>
                  {/* Ícone da cidade */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-white text-6xl font-baskerville font-bold opacity-40">
                      🏙️
                    </div>
                  </div>
                </div>
                {/* Gradient overlay para melhor legibilidade dos overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                
                {/* Demografia - Canto Superior Esquerdo */}
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Users className="w-4 h-4" />
                    <span className="text-sm font-semibold">Demografia</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {selectedCity.population && (
                      <div>População: {formatPopulation(selectedCity.population)}</div>
                    )}
                    {selectedCity.region && (
                      <div>Região: {selectedCity.region}</div>
                    )}
                  </div>
                </div>
                
                {/* Temperatura - Canto Superior Direito */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Thermometer className="w-4 h-4" />
                    <span className="text-sm font-semibold">Clima</span>
                  </div>
                  <div className="text-xs">
                    {(() => {
                      const tempData = getTemperatureData(selectedCity);
                      return tempData ? (
                        <div>
                          {tempData.celsius}°C
                        </div>
                      ) : (
                        <div>Não disponível</div>
                      );
                    })()}
                  </div>
                </div>

              </div>
              
              {/* Índices Econômicos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2 text-petroleo" />
                    Índices Econômicos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedCity.cost_of_living_index && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-petroleo" />
                        <div className="text-2xl font-bold text-petroleo">{selectedCity.cost_of_living_index}</div>
                        <div className="text-sm text-gray-600">Custo de Vida</div>
                      </div>
                    )}
                    {selectedCity.job_market_score && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Briefcase className="w-6 h-6 mx-auto mb-2 text-petroleo" />
                        <div className="text-2xl font-bold text-petroleo">{selectedCity.job_market_score}</div>
                        <div className="text-sm text-gray-600">Empregabilidade</div>
                      </div>
                    )}
                    {selectedCity.education_score && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <GraduationCap className="w-6 h-6 mx-auto mb-2 text-petroleo" />
                        <div className="text-2xl font-bold text-petroleo">{selectedCity.education_score}</div>
                        <div className="text-sm text-gray-600">Ensino</div>
                      </div>
                    )}
                    {selectedCity.business_opportunity_score && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Building2 className="w-6 h-6 mx-auto mb-2 text-petroleo" />
                        <div className="text-2xl font-bold text-petroleo">{selectedCity.business_opportunity_score}</div>
                        <div className="text-sm text-gray-600">Negócios</div>
                      </div>
                    )}
                  </div>
                  
                  {/* Legenda dos Índices */}
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 italic">Média nacional = 1</p>
                  </div>
                </CardContent>
              </Card>
              
              {/* Descrição Completa */}
              {selectedCity.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Sobre {selectedCity.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{selectedCity.description}</p>
                  </CardContent>
                </Card>
              )}
              
              {/* Destaques */}
              {selectedCity.highlights && selectedCity.highlights.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Destaques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {selectedCity.highlights.map((highlight, index) => (
                        <Badge key={index} variant="secondary" className="text-sm">
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {/* Oportunidades de Trabalho */}
              {selectedCity.job_opportunities && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Briefcase className="w-5 h-5 mr-2 text-petroleo" />
                      Oportunidades de Trabalho
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed">{selectedCity.job_opportunities}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <Footer />
    </div>
  );
};

export default DestinosIndex;