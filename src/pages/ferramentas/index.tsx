import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const FerramentasIndex = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cinza-claro to-white">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <Link to="/" className="flex items-center space-x-2">
            <ArrowLeft className="w-5 h-5 text-petroleo" />
            <span className="text-petroleo font-figtree font-medium">Voltar</span>
          </Link>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-baskerville font-bold text-petroleo mb-4">
            Ferramentas
          </h1>
          <p className="text-gray-600 mb-8">Em desenvolvimento...</p>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FerramentasIndex;