import { Link } from "react-router-dom";
import { Heart, Facebook, Instagram, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo e Descrição */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-xl font-bold">LifeWay USA</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Sua jornada para os Estados Unidos começa aqui. Oferecemos ferramentas e orientação especializada para tornar seu sonho americano realidade.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/destinos" className="text-gray-300 hover:text-white transition-colors">
                  Destinos
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-gray-300 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contato" className="text-gray-300 hover:text-white transition-colors">
                  Contato
                </Link>
              </li>
            </ul>
          </div>

          {/* Ferramentas */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Ferramentas</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/dreams" className="text-gray-300 hover:text-white transition-colors">
                  Criador de Sonhos
                </Link>
              </li>
              <li>
                <Link to="/visamatch" className="text-gray-300 hover:text-white transition-colors">
                  VisaMatch
                </Link>
              </li>
              <li>
                <Link to="/especialista" className="text-gray-300 hover:text-white transition-colors">
                  Especialista
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Informações de Contato */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300">
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              contato@lifewayusa.com
            </div>
            <div className="flex items-center">
              <Phone className="w-4 h-4 mr-2" />
              +1 (555) 123-4567
            </div>
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Miami, FL - USA
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>&copy; 2024 LifeWay USA. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
