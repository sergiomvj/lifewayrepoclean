import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cinza-claro to-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-baskerville font-bold text-petroleo mb-4">
          Página não encontrada
        </h1>
        <p className="text-gray-600 mb-8">
          A página que você está procurando não existe.
        </p>
        <Link to="/" className="text-petroleo hover:underline">
          Voltar ao início
        </Link>
      </div>
    </div>
  );
};

export default NotFound;