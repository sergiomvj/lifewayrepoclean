import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from '@/components/Navbar';
import ToolsSection from '@/components/ToolsSection';
import Footer from '@/components/Footer';

const ContatoPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    assunto: '',
    mensagem: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Aqui você pode implementar o envio do formulário
      // Por exemplo, enviar para um endpoint de API ou serviço de email
      
      // Simulando envio
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Mensagem enviada!",
        description: "Entraremos em contato em breve.",
      });

      // Limpar formulário
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        assunto: '',
        mensagem: ''
      });
    } catch (error) {
      toast({
        title: "Erro ao enviar mensagem",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Entre em Contato
          </h1>
          <p className="text-xl max-w-2xl mx-auto opacity-90">
            Estamos aqui para ajudar você em sua jornada para os Estados Unidos
          </p>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Envie sua mensagem</CardTitle>
                <CardDescription>
                  Preencha o formulário abaixo e entraremos em contato em breve
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome completo *</Label>
                      <Input
                        id="nome"
                        name="nome"
                        type="text"
                        required
                        value={formData.nome}
                        onChange={handleInputChange}
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        name="telefone"
                        type="tel"
                        value={formData.telefone}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="assunto">Assunto *</Label>
                    <Input
                      id="assunto"
                      name="assunto"
                      type="text"
                      required
                      value={formData.assunto}
                      onChange={handleInputChange}
                      placeholder="Como podemos ajudar?"
                    />
                  </div>

                  <div>
                    <Label htmlFor="mensagem">Mensagem *</Label>
                    <Textarea
                      id="mensagem"
                      name="mensagem"
                      required
                      value={formData.mensagem}
                      onChange={handleInputChange}
                      placeholder="Descreva como podemos ajudar você..."
                      rows={5}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Enviar mensagem
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Informações de Contato
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">E-mail</h3>
                      <p className="text-gray-600">contato@lifewayusa.com</p>
                      <p className="text-gray-600">suporte@lifewayusa.com</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Telefone</h3>
                      <p className="text-gray-600">+1 (555) 123-4567</p>
                      <p className="text-gray-600">+55 (11) 99999-9999</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Endereço</h3>
                      <p className="text-gray-600">Miami, FL - Estados Unidos</p>
                      <p className="text-gray-600">São Paulo, SP - Brasil</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Horário de Atendimento</h3>
                      <p className="text-gray-600">Segunda a Sexta: 9h às 18h</p>
                      <p className="text-gray-600">Sábado: 9h às 14h</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle>Perguntas Frequentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      <strong>Como funciona o VisaMatch?</strong><br />
                      Nossa ferramenta analisa seu perfil e recomenda os vistos mais adequados.
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Quanto tempo leva para receber uma resposta?</strong><br />
                      Respondemos todas as mensagens em até 24 horas úteis.
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>Vocês oferecem consultoria personalizada?</strong><br />
                      Sim! Entre em contato para saber mais sobre nossos serviços.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <ToolsSection />
      <Footer />
    </div>
  );
};

export default ContatoPage;
