import { Button } from "@/components/ui/button";
import { ArrowRight, Star, Users, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ToolsSection from "@/components/ToolsSection";
import Footer from "@/components/Footer";

const Index = () => {
  const [backgroundImage, setBackgroundImage] = useState('');

  // Lista de imagens da pasta family
  const familyImages = [
    'arto-suraj-VTDd6VP7Dps-unsplash.jpg',
    'daria-trofimova--c_Slf2pWtk-unsplash.jpg',
    'daria-trofimova-T-qNefXNUGw-unsplash.jpg',
    'derek-owens-cmzlFICyL6Y-unsplash.jpg',
    'dimas-rizki-pratama-etsWwWpzOiM-unsplash.jpg',
    'dmitry-rodionov-3NeRr1t1wwc-unsplash.jpg',
    'hoi-an-photographer-SVt5gv8xbKM-unsplash (1).jpg',
    'javier-gonzalez-fotografo-ScnyD7znFTk-unsplash.jpg',
    'kateryna-hliznitsova-N_6OpdOXcxo-unsplash.jpg',
    'lashawn-dobbs-xTcS9bZLu_8-unsplash.jpg',
    'nilanka-kariyawasam-AKk37Avu6o8-unsplash.jpg',
    'noor-vasquez-photo-6pXtLvo-lXs-unsplash.jpg',
    'richard-sagredo-FDJi2t7VWy0-unsplash.jpg',
    'samuel-yongbo-kwon-F4bA_QiMK6U-unsplash.jpg',
    'sourav-debnath-vAFEBbGvwgw-unsplash.jpg',
    'thay-jesus-7qrFkW3pgAg-unsplash.jpg'
  ];

  useEffect(() => {
    // Selecionar uma imagem aleatória
    const randomIndex = Math.floor(Math.random() * familyImages.length);
    const selectedImage = familyImages[randomIndex];
    setBackgroundImage(`/storage/images/family/${selectedImage}`);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        {backgroundImage && (
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
        )}
        {/* Overlay azul petróleo com 85% de opacidade */}
        <div className="absolute inset-0 bg-petroleo/85" />
        <div className="relative z-10 container mx-auto px-4 text-center text-white">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Planeje sua jornada<br />
            <span className="text-blue-200">rumo aos Estados Unidos</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Ferramentas inteligentes e especializadas para transformar seu sonho americano em realidade
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-petroleo text-white hover:bg-black">
              <Link to="/dreams">
                Começar agora
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-petroleo bg-petroleo text-white hover:bg-blue-400 hover:border-blue-400">
              <Link to="/visamatch">
                Descobrir meu visto
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Seção de Ferramentas */}
      <ToolsSection />

      {/* Estatísticas */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center mb-4">
                <Users className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">10K+</div>
              <div className="text-lg opacity-90">Usuários ativos</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <Star className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-lg opacity-90">Taxa de sucesso</div>
            </div>
            <div>
              <div className="flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-lg opacity-90">Suporte disponível</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Pronto para começar sua jornada?
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de pessoas que já realizaram o sonho americano com nossa ajuda
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link to="/dreams">
                Criar meus sonhos
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/especialista">
                Falar com especialista
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;