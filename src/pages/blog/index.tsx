import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { ArrowLeft, Clock, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from '@/components/Navbar';
import ToolsSection from '@/components/ToolsSection';
import Footer from '@/components/Footer';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  author_name: string | null;
  read_time: number | null;
  image_url: string | null;
  published_at: string | null;
  category_id: string | null;
  category?: {
    name: string;
  } | null;
  tags?: {
    name: string;
  }[];
}

// Lista de imagens disponíveis para fallback
const FALLBACK_IMAGES = [
  'abrir-empresa-eua.jpg',
  'apps-essenciais-brasileiros-eua.jpg',
  'asilo-politico-eua.jpg',
  'autorizacao-trabalho-eua.jpg',
  'calendario-lives-eventos-imigrantes.jpg',
  'cidadania-americana.jpg',
  'green-card-casamento.jpg',
  'green-card-habilidades.jpg',
  'green-card-refugiados.jpg',
  'loteria-green-card.jpg',
  'mercado-ti-eua-salarios.jpg',
  'mudanca-status-eua.jpg',
  'naturalizacao-americana.jpg',
  'renovar-green-card.jpg',
  'reunificacao-familiar.jpg',
  'sistema-imigracao-americano.jpg',
  'sponsor-eua.jpg',
  'trazer-familia-eua.jpg',
  'universidades-americanas-brasileiros.jpg',
  'visto-e2-investidor.jpg',
  'visto-eb5-investimento.jpg',
  'visto-estudante-f1.jpg',
  'visto-h1b-trabalho.jpg',
  'visto-j1-intercambio.jpg',
  'visto-k1-noivo.jpg',
  'visto-o1-habilidades.jpg',
  'visto-p1-atletas.jpg',
  'visto-r1-religioso.jpg',
  'visto-turista-b2.jpg'
];

// Posts de fallback para período de testes
const FALLBACK_POSTS: BlogPost[] = [
  {
    id: 'fallback-1',
    title: 'Guia Completo: Como Abrir uma Empresa nos EUA',
    slug: 'guia-completo-abrir-empresa-eua',
    summary: 'Descubra o passo a passo para abrir sua empresa nos Estados Unidos, desde a escolha do tipo de negócio até as questões fiscais.',
    author_name: 'Equipe LifeWayUSA',
    read_time: 8,
    image_url: '/storage/images/blog/abrir-empresa-eua.jpg',
    published_at: '2024-01-15T10:00:00Z',
    category_id: 'business',
    category: { name: 'Negócios' },
    tags: [{ name: 'Empreendedorismo' }, { name: 'Negócios' }]
  },
  {
    id: 'fallback-2',
    title: 'Apps Essenciais para Brasileiros nos EUA',
    slug: 'apps-essenciais-brasileiros-eua',
    summary: 'Conheça os aplicativos indispensáveis que todo brasileiro precisa ter ao se mudar para os Estados Unidos.',
    author_name: 'Equipe LifeWayUSA',
    read_time: 5,
    image_url: '/storage/images/blog/apps-essenciais-brasileiros-eua.jpg',
    published_at: '2024-01-10T14:30:00Z',
    category_id: 'lifestyle',
    category: { name: 'Estilo de Vida' },
    tags: [{ name: 'Tecnologia' }, { name: 'Dicas' }]
  },
  {
    id: 'fallback-3',
    title: 'Visto H1-B: Guia Completo para Profissionais',
    slug: 'visto-h1b-guia-completo',
    summary: 'Tudo que você precisa saber sobre o visto H1-B, desde os requisitos até o processo de aplicação.',
    author_name: 'Equipe LifeWayUSA',
    read_time: 12,
    image_url: '/storage/images/blog/visto-h1b-trabalho.jpg',
    published_at: '2024-01-08T09:15:00Z',
    category_id: 'visas',
    category: { name: 'Vistos' },
    tags: [{ name: 'H1-B' }, { name: 'Trabalho' }]
  },
  {
    id: 'fallback-4',
    title: 'Green Card por Casamento: Processo Completo',
    slug: 'green-card-casamento-processo',
    summary: 'Entenda todo o processo para obter o Green Card através do casamento com cidadão americano.',
    author_name: 'Equipe LifeWayUSA',
    read_time: 10,
    image_url: '/storage/images/blog/green-card-casamento.jpg',
    published_at: '2024-01-05T16:20:00Z',
    category_id: 'green-card',
    category: { name: 'Green Card' },
    tags: [{ name: 'Casamento' }, { name: 'Residência' }]
  },
  {
    id: 'fallback-5',
    title: 'Mercado de TI nos EUA: Salários e Oportunidades',
    slug: 'mercado-ti-eua-salarios-oportunidades',
    summary: 'Análise completa do mercado de tecnologia americano, incluindo salários médios e melhores oportunidades.',
    author_name: 'Equipe LifeWayUSA',
    read_time: 15,
    image_url: '/storage/images/blog/mercado-ti-eua-salarios.jpg',
    published_at: '2024-01-03T11:45:00Z',
    category_id: 'career',
    category: { name: 'Carreira' },
    tags: [{ name: 'Tecnologia' }, { name: 'Salários' }]
  },
  {
    id: 'fallback-6',
    title: 'Universidades Americanas: Guia para Brasileiros',
    slug: 'universidades-americanas-brasileiros',
    summary: 'Como escolher e se candidatar às melhores universidades americanas sendo brasileiro.',
    author_name: 'Equipe LifeWayUSA',
    read_time: 18,
    image_url: '/storage/images/blog/universidades-americanas-brasileiros.jpg',
    published_at: '2024-01-01T08:00:00Z',
    category_id: 'education',
    category: { name: 'Educação' },
    tags: [{ name: 'Universidades' }, { name: 'Estudos' }]
  }
];

const BlogPage = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Buscar posts publicados
      const { data: postsData, error: postsError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Se não há posts no banco, usar fallback
      if (!postsData || postsData.length === 0) {
        console.log('Nenhum post encontrado no banco, usando posts de fallback');
        setPosts(FALLBACK_POSTS);
        setUseFallback(true);
        setLoading(false);
        return;
      }

      // Buscar categorias e tags para cada post
      const postsWithDetails = await Promise.all(
        (postsData || []).map(async (post) => {
          // Buscar categoria
          let category = null;
          if (post.category_id) {
            const { data: categoryData } = await supabase
              .from('blog_categories')
              .select('name')
              .eq('id', post.category_id)
              .single();
            category = categoryData;
          }

          // Buscar tags
          const { data: tagsData } = await supabase
            .from('blog_post_tags')
            .select(`
              blog_tags(name)
            `)
            .eq('post_id', post.id);

          return {
            ...post,
            category,
            tags: tagsData?.map(item => item.blog_tags).filter(Boolean) || []
          };
        })
      );

      setPosts(postsWithDetails);
    } catch (error) {
      console.error('Erro ao buscar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cinza-claro to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleo mx-auto mb-4"></div>
          <p className="text-petroleo font-figtree">Carregando artigos...</p>
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
            Blog LifeWayUSA
          </h1>
          <p className="text-lg text-gray-600 font-figtree max-w-2xl mx-auto">
            Artigos, guias e dicas para sua jornada de imigração para os Estados Unidos
          </p>
          
          {/* Aviso de Período de Testes */}
          {useFallback && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-4xl mx-auto">
              <div className="flex items-start space-x-2">
                <div className="text-blue-600 text-sm">
                  📝 <strong>Período de Testes:</strong> Os artigos exibidos são exemplos para demonstração. 
                  Em breve, teremos conteúdo exclusivo e atualizado regularmente.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {posts.map((post) => (
            <Card key={post.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <Link to={`/blog/${post.slug}`} className="block">
                <div className="relative">
                  {post.image_url ? (
                    <img 
                      src={post.image_url} 
                      alt={post.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-lilas to-secondary rounded-t-lg flex items-center justify-center">
                      <div className="text-petroleo text-4xl font-baskerville font-bold">
                        {post.title.charAt(0)}
                      </div>
                    </div>
                  )}
                  
                  {post.category && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-white/90 text-petroleo">
                        {post.category.name}
                      </Badge>
                    </div>
                  )}
                </div>

                <CardHeader>
                  <CardTitle className="text-xl font-baskerville text-petroleo line-clamp-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">
                  {post.summary && (
                    <p className="text-gray-600 font-figtree text-sm line-clamp-3">
                      {post.summary}
                    </p>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-2 text-sm text-gray-500 font-figtree">
                    {post.author_name && (
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{post.author_name}</span>
                      </div>
                    )}
                    
                    {post.read_time && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.read_time} min</span>
                      </div>
                    )}

                    {post.published_at && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(post.published_at)}</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>

        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-600 font-figtree text-lg">
              Nenhum artigo publicado ainda. Volte em breve!
            </p>
          </div>
        )}
      </div>

      <ToolsSection />
      <Footer />
    </div>
  );
};

export default BlogPage;