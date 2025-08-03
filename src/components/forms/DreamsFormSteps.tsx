import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';
import { CriadorSonhosFormData } from '@/types/forms';
import { getFieldSuggestions } from '@/utils/dreamsValidation';

interface StepProps {
  formData: CriadorSonhosFormData;
  updateFormData: (field: keyof CriadorSonhosFormData, value: any) => void;
  getFieldState: (field: keyof CriadorSonhosFormData) => any;
  getValidationSuggestions: (field: keyof CriadorSonhosFormData) => string[];
  validationSummary: any;
}

// Field wrapper component with validation display
const FieldWrapper: React.FC<{
  field: keyof CriadorSonhosFormData;
  label: string;
  required?: boolean;
  children: React.ReactNode;
  getFieldState: (field: keyof CriadorSonhosFormData) => any;
  getValidationSuggestions: (field: keyof CriadorSonhosFormData) => string[];
  formData: CriadorSonhosFormData;
}> = ({ field, label, required, children, getFieldState, getValidationSuggestions, formData }) => {
  const fieldState = getFieldState(field);
  const suggestions = getValidationSuggestions(field);
  const customSuggestions = getFieldSuggestions(field, formData[field] || '');

  return (
    <div className="space-y-2">
      <Label htmlFor={field} className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {fieldState.isValid && (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
      </Label>
      
      {children}
      
      {/* Error message */}
      {fieldState.showError && (
        <div className="flex items-center gap-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{fieldState.error}</span>
        </div>
      )}
      
      {/* Suggestions */}
      {(suggestions.length > 0 || customSuggestions.length > 0) && !fieldState.showError && (
        <div className="space-y-1">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center gap-2 text-blue-600 text-sm">
              <Lightbulb className="w-3 h-3" />
              <span>{suggestion}</span>
            </div>
          ))}
          {customSuggestions.map((suggestion, index) => (
            <div key={`custom-${index}`} className="flex items-center gap-2 text-amber-600 text-sm">
              <Lightbulb className="w-3 h-3" />
              <span>{suggestion}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Step 1: Personal Information
export const PersonalInfoStep: React.FC<StepProps> = ({ 
  formData, 
  updateFormData, 
  getFieldState, 
  getValidationSuggestions 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Vamos começar conhecendo você
        </h3>
        <p className="text-gray-600">
          Compartilhe suas informações básicas para personalizarmos sua jornada
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWrapper
          field="nome"
          label="Nome completo"
          required
          getFieldState={getFieldState}
          getValidationSuggestions={getValidationSuggestions}
          formData={formData}
        >
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => updateFormData('nome', e.target.value)}
            placeholder="Seu nome completo"
            className={getFieldState('nome').showError ? 'border-red-500' : ''}
          />
        </FieldWrapper>

        <FieldWrapper
          field="idade"
          label="Idade"
          required
          getFieldState={getFieldState}
          getValidationSuggestions={getValidationSuggestions}
          formData={formData}
        >
          <Input
            id="idade"
            type="number"
            value={formData.idade}
            onChange={(e) => updateFormData('idade', e.target.value)}
            placeholder="Sua idade"
            min="18"
            max="80"
            className={getFieldState('idade').showError ? 'border-red-500' : ''}
          />
        </FieldWrapper>
      </div>

      <FieldWrapper
        field="profissao"
        label="Profissão atual"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Input
          id="profissao"
          value={formData.profissao}
          onChange={(e) => updateFormData('profissao', e.target.value)}
          placeholder="Ex: Engenheiro de Software, Médico, Professor..."
          className={getFieldState('profissao').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>

      <FieldWrapper
        field="experiencia"
        label="Experiência profissional"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Textarea
          id="experiencia"
          value={formData.experiencia}
          onChange={(e) => updateFormData('experiencia', e.target.value)}
          placeholder="Descreva sua experiência profissional, principais conquistas e habilidades..."
          rows={4}
          className={getFieldState('experiencia').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>
    </div>
  );
};

// Step 2: Goals and Objectives
export const GoalsStep: React.FC<StepProps> = ({ 
  formData, 
  updateFormData, 
  getFieldState, 
  getValidationSuggestions 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Qual é o seu sonho americano?
        </h3>
        <p className="text-gray-600">
          Defina seus objetivos e prioridades para sua jornada nos EUA
        </p>
      </div>

      <FieldWrapper
        field="objetivo_principal"
        label="Objetivo principal"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Textarea
          id="objetivo_principal"
          value={formData.objetivo_principal}
          onChange={(e) => updateFormData('objetivo_principal', e.target.value)}
          placeholder="Descreva seu principal objetivo ao se mudar para os EUA..."
          rows={3}
          className={getFieldState('objetivo_principal').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FieldWrapper
          field="categoria"
          label="Categoria principal"
          required
          getFieldState={getFieldState}
          getValidationSuggestions={getValidationSuggestions}
          formData={formData}
        >
          <Select value={formData.categoria} onValueChange={(value) => updateFormData('categoria', value)}>
            <SelectTrigger className={getFieldState('categoria').showError ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="trabalho">Trabalho</SelectItem>
              <SelectItem value="estudo">Estudo</SelectItem>
              <SelectItem value="investimento">Investimento</SelectItem>
              <SelectItem value="familia">Família</SelectItem>
              <SelectItem value="aposentadoria">Aposentadoria</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>

        <FieldWrapper
          field="prioridade"
          label="Prioridade"
          required
          getFieldState={getFieldState}
          getValidationSuggestions={getValidationSuggestions}
          formData={formData}
        >
          <Select value={formData.prioridade} onValueChange={(value) => updateFormData('prioridade', value)}>
            <SelectTrigger className={getFieldState('prioridade').showError ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="baixa">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-50">Baixa</Badge>
                  <span>Flexível com tempo</span>
                </div>
              </SelectItem>
              <SelectItem value="media">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-yellow-50">Média</Badge>
                  <span>Moderadamente urgente</span>
                </div>
              </SelectItem>
              <SelectItem value="alta">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-red-50">Alta</Badge>
                  <span>Urgente</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </FieldWrapper>
      </div>

      <FieldWrapper
        field="timeline"
        label="Timeline desejado"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Input
          id="timeline"
          value={formData.timeline}
          onChange={(e) => updateFormData('timeline', e.target.value)}
          placeholder="Ex: 6 meses, 1 ano, 2-3 anos..."
          className={getFieldState('timeline').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>
    </div>
  );
};

// Step 3: Current Situation
export const CurrentSituationStep: React.FC<StepProps> = ({ 
  formData, 
  updateFormData, 
  getFieldState, 
  getValidationSuggestions 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Sua situação atual
        </h3>
        <p className="text-gray-600">
          Entenda onde você está hoje para planejar melhor sua jornada
        </p>
      </div>

      <FieldWrapper
        field="situacao_atual"
        label="Situação atual"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Textarea
          id="situacao_atual"
          value={formData.situacao_atual}
          onChange={(e) => updateFormData('situacao_atual', e.target.value)}
          placeholder="Descreva sua situação profissional, familiar e financeira atual..."
          rows={4}
          className={getFieldState('situacao_atual').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>

      <FieldWrapper
        field="recursos_disponiveis"
        label="Recursos disponíveis"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Textarea
          id="recursos_disponiveis"
          value={formData.recursos_disponiveis}
          onChange={(e) => updateFormData('recursos_disponiveis', e.target.value)}
          placeholder="Inclua recursos financeiros, educacionais, profissionais e pessoais..."
          rows={4}
          className={getFieldState('recursos_disponiveis').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>

      <FieldWrapper
        field="obstaculos"
        label="Principais obstáculos"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Textarea
          id="obstaculos"
          value={formData.obstaculos}
          onChange={(e) => updateFormData('obstaculos', e.target.value)}
          placeholder="Mencione desafios como idioma, visto, financeiro ou profissional..."
          rows={4}
          className={getFieldState('obstaculos').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>
    </div>
  );
};

// Step 4: Specific Details
export const SpecificDetailsStep: React.FC<StepProps> = ({ 
  formData, 
  updateFormData, 
  getFieldState, 
  getValidationSuggestions 
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Detalhes específicos
        </h3>
        <p className="text-gray-600">
          Compartilhe detalhes específicos para personalizar ainda mais seu plano
        </p>
      </div>

      <FieldWrapper
        field="detalhes_especificos"
        label="Detalhes específicos"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Textarea
          id="detalhes_especificos"
          value={formData.detalhes_especificos}
          onChange={(e) => updateFormData('detalhes_especificos', e.target.value)}
          placeholder="Inclua preferências de localização, tipo de trabalho, estilo de vida..."
          rows={4}
          className={getFieldState('detalhes_especificos').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>

      <FieldWrapper
        field="motivacao"
        label="Motivação principal"
        required
        getFieldState={getFieldState}
        getValidationSuggestions={getValidationSuggestions}
        formData={formData}
      >
        <Textarea
          id="motivacao"
          value={formData.motivacao}
          onChange={(e) => updateFormData('motivacao', e.target.value)}
          placeholder="Explique o que o motiva e como isso mudará sua vida..."
          rows={4}
          className={getFieldState('motivacao').showError ? 'border-red-500' : ''}
        />
      </FieldWrapper>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">
              Quase lá! 🎉
            </h4>
            <p className="text-blue-700 text-sm">
              Após finalizar, nossa IA criará um plano personalizado com cenários de transformação, 
              cronograma detalhado e ferramentas práticas para realizar seus sonhos nos EUA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
