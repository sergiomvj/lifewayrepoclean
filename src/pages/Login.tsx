import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta ao LifeWayUSA.",
        });

        navigate('/dashboard');
      } else {
        // Cadastro
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique seu email para confirmar a conta.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro na autenticação",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro no login com Google",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    }
  };

  const handleGuestAccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[80vh]">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-petroleo to-petroleo/80 rounded-2xl flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-white rounded-lg"></div>
            </div>
            
            <CardTitle className="text-3xl font-baskerville font-bold text-petroleo">
              {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
            </CardTitle>
            <p className="text-gray-600">
              {isLogin 
                ? 'Acesse sua conta para continuar sua jornada' 
                : 'Comece sua jornada rumo aos Estados Unidos'
              }
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Login com Google */}
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full"
              onClick={handleGoogleAuth}
            >
              <Mail className="w-4 h-4 mr-2" />
              {isLogin ? 'Entrar' : 'Cadastrar'} com Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Formulário de Email */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirme sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className="w-full bg-petroleo hover:bg-petroleo/90"
                disabled={loading}
              >
                {loading ? 'Carregando...' : (isLogin ? 'Entrar' : 'Criar conta')}
              </Button>
            </form>

            {/* Toggle entre Login/Cadastro */}
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => setIsLogin(!isLogin)}
                className="text-petroleo"
              >
                {isLogin 
                  ? 'Não tem uma conta? Cadastre-se' 
                  : 'Já tem uma conta? Faça login'
                }
              </Button>
            </div>

            {/* Continuar como visitante */}
            <Button 
              variant="ghost" 
              size="lg" 
              className="w-full"
              onClick={handleGuestAccess}
            >
              Continuar como visitante
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
};

export default Login;