import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Shield,
  Star,
  TrendingUp,
  Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIntelligentValidation } from '@/hooks/useIntelligentValidation';

interface IntelligentValidationDemoProps {
  className?: string;
}

export function IntelligentValidationDemo({ className }: IntelligentValidationDemoProps) {
  const [formData, setFormData] = useState({
    profession: '',
    experience_years: '',
    english_level: '',
    salary_expectation: '',
    visa_category: ''
  });

  const {
    validateField,
    validationResults,
    isValidating,
    validationErrors,
    validationSuggestions,
    overallConfidence,
    personalizationLevel,
    trackUserReaction
  } = useIntelligentValidation({
    enableRealTimeValidation: true,
    enableLearning: true,
    confidenceThreshold: 0.7,
    debounceMs: 800
  });

  const handleFieldChange = async (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    
    // Trigger intelligent validation
    try {
      await validateField(fieldId, value, formData);
    } catch (error) {
      console.error('Erro na validação:', error);
    }
  };

  const getFieldValidation = (fieldId: string) => {
    return validationResults[fieldId] || [];
  };

  const hasErrors = (fieldId: string) => {
    return validationErrors[fieldId] && validationErrors[fieldId].length > 0;
  };

  const hasSuggestions = (fieldId: string) => {
    return validationSuggestions[fieldId] && validationSuggestions[fieldId].length > 0;
  };

  return (
    <div className={cn("max-w-4xl mx-auto space-y-6", className)}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-blue-600" />
            <span>Sistema de Validação Inteligente</span>
            <Badge variant="secondary" className="ml-2">Fase 2.2.2</Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Demonstração do sistema de validação adaptativa baseada em perfil do usuário
          </p>
        </CardHeader>
        <CardContent>
          {/* Métricas do sistema */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Confiança Geral</p>
                <p className="text-lg font-bold text-blue-600">
                  {Math.round(overallConfidence * 100)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-purple-50 rounded-lg">
              <Star className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium">Personalização</p>
                <p className="text-lg font-bold text-purple-600">
                  {Math.round(personalizationLevel * 100)}%
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-sm font-bold text-green-600">
                  {isValidating ? 'Validando...' : 'Ativo'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulário de demonstração */}
      <Card>
        <CardHeader>
          <CardTitle>Formulário de Teste</CardTitle>
          <p className="text-sm text-muted-foreground">
            Preencha os campos abaixo para ver a validação inteligente em ação
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Campo: Profissão */}
          <div className="space-y-2">
            <Label htmlFor="profession">Profissão</Label>
            <Input
              id="profession"
              value={formData.profession}
              onChange={(e) => handleFieldChange('profession', e.target.value)}
              placeholder="Ex: Engenheiro de Software"
              className={hasErrors('profession') ? 'border-red-500' : ''}
            />
            {getFieldValidation('profession').map((result, index) => (
              <Alert
                key={index}
                className={cn(
                  result.severity === 'error' && !result.is_valid && 'border-red-200 bg-red-50',
                  result.severity === 'warning' && 'border-yellow-200 bg-yellow-50',
                  result.severity === 'success' && result.is_valid && 'border-green-200 bg-green-50',
                  result.severity === 'info' && 'border-blue-200 bg-blue-50'
                )}
              >
                {result.severity === 'error' && !result.is_valid && <AlertCircle className="h-4 w-4 text-red-600" />}
                {result.severity === 'success' && result.is_valid && <CheckCircle className="h-4 w-4 text-green-600" />}
                {result.severity === 'info' && <Shield className="h-4 w-4 text-blue-600" />}
                
                <AlertDescription>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{result.message}</p>
                      {result.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium mb-1">Sugestões:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {result.suggestions.map((suggestion, suggIndex) => (
                              <li key={suggIndex} className="text-xs opacity-80">
                                {suggestion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 flex items-center space-x-1">
                      {result.personalization_applied && (
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Personalizado
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          result.confidence_score >= 0.8 && "border-green-200 text-green-700",
                          result.confidence_score >= 0.6 && result.confidence_score < 0.8 && "border-yellow-200 text-yellow-700",
                          result.confidence_score < 0.6 && "border-red-200 text-red-700"
                        )}
                      >
                        {Math.round(result.confidence_score * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Botões de feedback */}
                  <div className="mt-3 flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => trackUserReaction('profession', 'accepted')}
                    >
                      ✓ Útil
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs"
                      onClick={() => trackUserReaction('profession', 'ignored')}
                    >
                      ✗ Não útil
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Campo: Anos de Experiência */}
          <div className="space-y-2">
            <Label htmlFor="experience_years">Anos de Experiência</Label>
            <Input
              id="experience_years"
              type="number"
              value={formData.experience_years}
              onChange={(e) => handleFieldChange('experience_years', e.target.value)}
              placeholder="Ex: 5"
              className={hasErrors('experience_years') ? 'border-red-500' : ''}
            />
            {getFieldValidation('experience_years').map((result, index) => (
              <Alert key={index} className="border-blue-200 bg-blue-50">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription>
                  <p className="font-medium">{result.message}</p>
                  <Badge variant="outline" className="mt-1">
                    Confiança: {Math.round(result.confidence_score * 100)}%
                  </Badge>
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Campo: Nível de Inglês */}
          <div className="space-y-2">
            <Label htmlFor="english_level">Nível de Inglês</Label>
            <select
              id="english_level"
              value={formData.english_level}
              onChange={(e) => handleFieldChange('english_level', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione...</option>
              <option value="basic">Básico</option>
              <option value="intermediate">Intermediário</option>
              <option value="advanced">Avançado</option>
              <option value="fluent">Fluente</option>
            </select>
            {getFieldValidation('english_level').map((result, index) => (
              <Alert key={index} className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <p className="font-medium">{result.message}</p>
                  {result.suggestions.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs font-medium">Dica:</p>
                      <p className="text-xs">{result.suggestions[0]}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Campo: Expectativa Salarial */}
          <div className="space-y-2">
            <Label htmlFor="salary_expectation">Expectativa Salarial (USD)</Label>
            <Input
              id="salary_expectation"
              value={formData.salary_expectation}
              onChange={(e) => handleFieldChange('salary_expectation', e.target.value)}
              placeholder="Ex: 80000"
              className={hasErrors('salary_expectation') ? 'border-red-500' : ''}
            />
            {getFieldValidation('salary_expectation').map((result, index) => (
              <Alert 
                key={index} 
                className={cn(
                  result.is_valid ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'
                )}
              >
                {result.is_valid ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                }
                <AlertDescription>
                  <p className="font-medium">{result.message}</p>
                  {result.suggestions.length > 0 && (
                    <ul className="mt-1 list-disc list-inside text-xs">
                      {result.suggestions.map((suggestion, suggIndex) => (
                        <li key={suggIndex}>{suggestion}</li>
                      ))}
                    </ul>
                  )}
                </AlertDescription>
              </Alert>
            ))}
          </div>

          {/* Status de validação */}
          {isValidating && (
            <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-blue-600 font-medium">Validando com IA...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações sobre o sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona a Validação Inteligente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">🎯 Validação Baseada em Perfil</h4>
              <p className="text-sm text-muted-foreground">
                O sistema adapta as regras de validação baseado na profissão, experiência e objetivos do usuário.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">🧠 Aprendizado Contínuo</h4>
              <p className="text-sm text-muted-foreground">
                As validações melhoram com base no feedback dos usuários e padrões identificados.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">⚡ Validação em Tempo Real</h4>
              <p className="text-sm text-muted-foreground">
                Feedback instantâneo com debounce inteligente para melhor experiência do usuário.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">📊 Métricas de Confiança</h4>
              <p className="text-sm text-muted-foreground">
                Cada validação inclui um score de confiança baseado na qualidade dos dados e contexto.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default IntelligentValidationDemo;
