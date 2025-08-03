import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  Heart, 
  Users, 
  Target,
  DollarSign,
  Calendar,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useUserContext } from '@/hooks/useUserContext';
import { supabase } from '@/integrations/supabase/client';

interface CreateProfileProps {
  onComplete?: (profile: any) => void;
  onCancel?: () => void;
}

const CreateProfile: React.FC<CreateProfileProps> = ({ onComplete, onCancel }) => {
  const { user } = useUserContext();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dados do perfil
  const [profileData, setProfileData] = useState({
    // Informações pessoais
    name: '',
    age: '',
    profession: '',
    experience_years: '',
    education_level: '',
    english_level: '',
    current_country: '',
    current_city: '',
    marital_status: '',
    children_count: '',
    
    // Objetivos de imigração
    primary_objective: '',
    category: '',
    timeline: '',
    priority: '',
    target_states: [] as string[],
    specific_cities: [] as string[],
    motivation: '',
    success_criteria: [] as string[],
    
    // Situação atual
    employment_status: '',
    current_salary: '',
    current_salary_currency: 'USD',
    available_funds: '',
    available_funds_currency: 'USD',
    obstacles: [] as string[],
    strengths: [] as string[],
    
    // Conexões e tentativas anteriores
    us_connections: [] as string[],
    previous_visa_attempts: [] as string[]
  });

  const totalSteps = 4;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!profileData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!profileData.profession.trim()) newErrors.profession = 'Profissão é obrigatória';
        if (!profileData.education_level) newErrors.education_level = 'Nível de educação é obrigatório';
        if (!profileData.english_level) newErrors.english_level = 'Nível de inglês é obrigatório';
        if (!profileData.current_country.trim()) newErrors.current_country = 'País atual é obrigatório';
        break;
      
      case 2:
        if (!profileData.primary_objective.trim()) newErrors.primary_objective = 'Objetivo principal é obrigatório';
        if (!profileData.category) newErrors.category = 'Categoria é obrigatória';
        if (!profileData.timeline.trim()) newErrors.timeline = 'Timeline é obrigatório';
        if (!profileData.priority) newErrors.priority = 'Prioridade é obrigatória';
        if (!profileData.motivation.trim()) newErrors.motivation = 'Motivação é obrigatória';
        break;
      
      case 3:
        if (!profileData.employment_status) newErrors.employment_status = 'Status de emprego é obrigatório';
        if (!profileData.available_funds.trim()) newErrors.available_funds = 'Fundos disponíveis são obrigatórios';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayAdd = (field: string, value: string) => {
    if (value.trim()) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...(prev[field] as string[]), value.trim()]
      }));
    }
  };

  const handleArrayRemove = (field: string, index: number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsLoading(true);
    try {
      // Preparar dados para inserção
      const profileToSave = {
        user_id: user?.user_id,
        name: profileData.name,
        age: profileData.age ? parseInt(profileData.age) : null,
        profession: profileData.profession,
        experience_years: profileData.experience_years ? parseInt(profileData.experience_years) : null,
        education_level: profileData.education_level,
        english_level: profileData.english_level,
        current_country: profileData.current_country,
        current_city: profileData.current_city || null,
        marital_status: profileData.marital_status || null,
        children_count: profileData.children_count ? parseInt(profileData.children_count) : null,
        
        // Objetivos (JSON)
        immigration_goals: {
          primary_objective: profileData.primary_objective,
          category: profileData.category,
          timeline: profileData.timeline,
          priority: profileData.priority,
          target_states: profileData.target_states,
          specific_cities: profileData.specific_cities,
          motivation: profileData.motivation,
          success_criteria: profileData.success_criteria
        },
        
        // Situação atual (JSON)
        current_situation: {
          employment_status: profileData.employment_status,
          current_salary: profileData.current_salary ? parseFloat(profileData.current_salary) : null,
          current_salary_currency: profileData.current_salary_currency,
          available_funds: parseFloat(profileData.available_funds),
          available_funds_currency: profileData.available_funds_currency,
          obstacles: profileData.obstacles,
          strengths: profileData.strengths,
          us_connections: profileData.us_connections,
          previous_visa_attempts: profileData.previous_visa_attempts
        },
        
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Salvar no Supabase
      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileToSave])
        .select()
        .single();

      if (error) throw error;

      console.log('Perfil criado com sucesso:', data);
      
      if (onComplete) {
        onComplete(data);
      }
      
    } catch (error) {
      console.error('Erro ao criar perfil:', error);
      setErrors({ submit: 'Erro ao salvar perfil. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Informações Pessoais</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome Completo *</Label>
          <Input
            id="name"
            value={profileData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={errors.name ? 'border-red-500' : ''}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div>
          <Label htmlFor="age">Idade</Label>
          <Input
            id="age"
            type="number"
            value={profileData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="profession">Profissão *</Label>
          <Input
            id="profession"
            value={profileData.profession}
            onChange={(e) => handleInputChange('profession', e.target.value)}
            className={errors.profession ? 'border-red-500' : ''}
          />
          {errors.profession && <p className="text-sm text-red-500 mt-1">{errors.profession}</p>}
        </div>

        <div>
          <Label htmlFor="experience_years">Anos de Experiência</Label>
          <Input
            id="experience_years"
            type="number"
            value={profileData.experience_years}
            onChange={(e) => handleInputChange('experience_years', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="education_level">Nível de Educação *</Label>
          <Select value={profileData.education_level} onValueChange={(value) => handleInputChange('education_level', value)}>
            <SelectTrigger className={errors.education_level ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">Ensino Médio</SelectItem>
              <SelectItem value="bachelor">Graduação</SelectItem>
              <SelectItem value="master">Mestrado</SelectItem>
              <SelectItem value="phd">Doutorado</SelectItem>
              <SelectItem value="professional">Profissionalizante</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
          {errors.education_level && <p className="text-sm text-red-500 mt-1">{errors.education_level}</p>}
        </div>

        <div>
          <Label htmlFor="english_level">Nível de Inglês *</Label>
          <Select value={profileData.english_level} onValueChange={(value) => handleInputChange('english_level', value)}>
            <SelectTrigger className={errors.english_level ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Básico</SelectItem>
              <SelectItem value="intermediate">Intermediário</SelectItem>
              <SelectItem value="advanced">Avançado</SelectItem>
              <SelectItem value="native">Nativo</SelectItem>
            </SelectContent>
          </Select>
          {errors.english_level && <p className="text-sm text-red-500 mt-1">{errors.english_level}</p>}
        </div>

        <div>
          <Label htmlFor="current_country">País Atual *</Label>
          <Input
            id="current_country"
            value={profileData.current_country}
            onChange={(e) => handleInputChange('current_country', e.target.value)}
            className={errors.current_country ? 'border-red-500' : ''}
          />
          {errors.current_country && <p className="text-sm text-red-500 mt-1">{errors.current_country}</p>}
        </div>

        <div>
          <Label htmlFor="current_city">Cidade Atual</Label>
          <Input
            id="current_city"
            value={profileData.current_city}
            onChange={(e) => handleInputChange('current_city', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="marital_status">Estado Civil</Label>
          <Select value={profileData.marital_status} onValueChange={(value) => handleInputChange('marital_status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Solteiro(a)</SelectItem>
              <SelectItem value="married">Casado(a)</SelectItem>
              <SelectItem value="divorced">Divorciado(a)</SelectItem>
              <SelectItem value="widowed">Viúvo(a)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="children_count">Número de Filhos</Label>
          <Input
            id="children_count"
            type="number"
            value={profileData.children_count}
            onChange={(e) => handleInputChange('children_count', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">Objetivos de Imigração</h3>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="primary_objective">Objetivo Principal *</Label>
          <Input
            id="primary_objective"
            value={profileData.primary_objective}
            onChange={(e) => handleInputChange('primary_objective', e.target.value)}
            placeholder="Ex: Trabalhar como engenheiro de software nos EUA"
            className={errors.primary_objective ? 'border-red-500' : ''}
          />
          {errors.primary_objective && <p className="text-sm text-red-500 mt-1">{errors.primary_objective}</p>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select value={profileData.category} onValueChange={(value) => handleInputChange('category', value)}>
              <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="estudo">Estudo</SelectItem>
                <SelectItem value="investimento">Investimento</SelectItem>
                <SelectItem value="familia">Família</SelectItem>
                <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
            {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <Label htmlFor="priority">Prioridade *</Label>
            <Select value={profileData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
            {errors.priority && <p className="text-sm text-red-500 mt-1">{errors.priority}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="timeline">Timeline *</Label>
          <Input
            id="timeline"
            value={profileData.timeline}
            onChange={(e) => handleInputChange('timeline', e.target.value)}
            placeholder="Ex: 2-3 anos"
            className={errors.timeline ? 'border-red-500' : ''}
          />
          {errors.timeline && <p className="text-sm text-red-500 mt-1">{errors.timeline}</p>}
        </div>

        <div>
          <Label htmlFor="motivation">Motivação *</Label>
          <Textarea
            id="motivation"
            value={profileData.motivation}
            onChange={(e) => handleInputChange('motivation', e.target.value)}
            placeholder="Descreva suas motivações para imigrar para os EUA..."
            className={errors.motivation ? 'border-red-500' : ''}
            rows={4}
          />
          {errors.motivation && <p className="text-sm text-red-500 mt-1">{errors.motivation}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Situação Atual</h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employment_status">Status de Emprego *</Label>
          <Select value={profileData.employment_status} onValueChange={(value) => handleInputChange('employment_status', value)}>
            <SelectTrigger className={errors.employment_status ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="employed">Empregado</SelectItem>
              <SelectItem value="unemployed">Desempregado</SelectItem>
              <SelectItem value="self_employed">Autônomo</SelectItem>
              <SelectItem value="student">Estudante</SelectItem>
            </SelectContent>
          </Select>
          {errors.employment_status && <p className="text-sm text-red-500 mt-1">{errors.employment_status}</p>}
        </div>

        <div>
          <Label htmlFor="current_salary">Salário Atual</Label>
          <div className="flex gap-2">
            <Input
              id="current_salary"
              type="number"
              value={profileData.current_salary}
              onChange={(e) => handleInputChange('current_salary', e.target.value)}
              placeholder="0"
            />
            <Select value={profileData.current_salary_currency} onValueChange={(value) => handleInputChange('current_salary_currency', value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="available_funds">Fundos Disponíveis *</Label>
          <div className="flex gap-2">
            <Input
              id="available_funds"
              type="number"
              value={profileData.available_funds}
              onChange={(e) => handleInputChange('available_funds', e.target.value)}
              placeholder="0"
              className={errors.available_funds ? 'border-red-500' : ''}
            />
            <Select value={profileData.available_funds_currency} onValueChange={(value) => handleInputChange('available_funds_currency', value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="BRL">BRL</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {errors.available_funds && <p className="text-sm text-red-500 mt-1">{errors.available_funds}</p>}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="h-5 w-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Revisão e Confirmação</h3>
      </div>

      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Revise suas informações antes de finalizar. Você poderá editar seu perfil posteriormente.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Informações Pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Nome:</strong> {profileData.name}</p>
            <p><strong>Profissão:</strong> {profileData.profession}</p>
            <p><strong>Educação:</strong> {profileData.education_level}</p>
            <p><strong>Inglês:</strong> {profileData.english_level}</p>
            <p><strong>Localização:</strong> {profileData.current_city}, {profileData.current_country}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Objetivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>Objetivo:</strong> {profileData.primary_objective}</p>
            <p><strong>Categoria:</strong> {profileData.category}</p>
            <p><strong>Timeline:</strong> {profileData.timeline}</p>
            <p><strong>Prioridade:</strong> {profileData.priority}</p>
          </CardContent>
        </Card>
      </div>

      {errors.submit && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{errors.submit}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Criar Perfil</CardTitle>
              <p className="text-muted-foreground">Configure seu perfil para uma experiência personalizada</p>
            </div>
            <Badge variant="outline">
              Passo {currentStep} de {totalSteps}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="mt-4" />
        </CardHeader>

        <CardContent>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}

          <div className="flex justify-between mt-8">
            <div>
              {currentStep > 1 && (
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
              )}
              {onCancel && currentStep === 1 && (
                <Button variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
            </div>

            <div>
              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Perfil
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateProfile;
