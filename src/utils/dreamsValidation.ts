import { ValidationRule } from '@/types/forms';
import { CriadorSonhosFormData } from '@/types/forms';

// Validation rules for Criador de Sonhos form
export const dreamsValidationRules: Record<keyof CriadorSonhosFormData, ValidationRule[]> = {
  // Base fields
  id: [],
  created_at: [],
  updated_at: [],
  user_id: [],

  // Step 1: Personal Information
  nome: [
    { required: true },
    { minLength: 2, maxLength: 100 },
    { pattern: /^[a-zA-ZÀ-ÿ\s]+$/ }
  ],
  
  idade: [
    { required: true },
    { pattern: /^\d+$/ },
    { 
      custom: (value: string) => {
        const age = parseInt(value);
        return age >= 18 && age <= 80 ? true : 'Idade deve estar entre 18 e 80 anos';
      }
    }
  ],
  
  profissao: [
    { required: true },
    { minLength: 3, maxLength: 100 }
  ],
  
  experiencia: [
    { required: true },
    { minLength: 10, maxLength: 500 }
  ],

  // Step 2: Goals
  objetivo_principal: [
    { required: true },
    { minLength: 10, maxLength: 300 }
  ],
  
  categoria: [
    { required: true },
    {
      custom: (value: string) => {
        const validCategories = ['trabalho', 'estudo', 'investimento', 'familia', 'aposentadoria', 'outro'];
        return validCategories.includes(value) ? true : 'Categoria inválida';
      }
    }
  ],
  
  timeline: [
    { required: true },
    { minLength: 5, maxLength: 50 }
  ],
  
  prioridade: [
    { required: true },
    {
      custom: (value: string) => {
        const validPriorities = ['baixa', 'media', 'alta'];
        return validPriorities.includes(value) ? true : 'Prioridade inválida';
      }
    }
  ],

  // Step 3: Current Situation
  situacao_atual: [
    { required: true },
    { minLength: 20, maxLength: 1000 }
  ],
  
  recursos_disponiveis: [
    { required: true },
    { maxLength: 500 }
  ],
  
  obstaculos: [
    { required: true },
    { minLength: 10, maxLength: 500 }
  ],

  // Step 4: Specific Details
  detalhes_especificos: [
    { required: true },
    { minLength: 20, maxLength: 1000 }
  ],
  
  motivacao: [
    { required: true },
    { minLength: 20, maxLength: 1000 }
  ],

  // Optional fields for v1.80
  familia_composicao: [],
  interesses: [],
  cidades_interesse: []
};

// Helper function to get step-specific validation rules
export const getStepValidationRules = (stepNumber: number): Record<string, ValidationRule[]> => {
  switch (stepNumber) {
    case 1:
      return {
        nome: dreamsValidationRules.nome,
        idade: dreamsValidationRules.idade,
        profissao: dreamsValidationRules.profissao,
        experiencia: dreamsValidationRules.experiencia
      };
    
    case 2:
      return {
        objetivo_principal: dreamsValidationRules.objetivo_principal,
        categoria: dreamsValidationRules.categoria,
        timeline: dreamsValidationRules.timeline,
        prioridade: dreamsValidationRules.prioridade
      };
    
    case 3:
      return {
        situacao_atual: dreamsValidationRules.situacao_atual,
        recursos_disponiveis: dreamsValidationRules.recursos_disponiveis,
        obstaculos: dreamsValidationRules.obstaculos
      };
    
    case 4:
      return {
        detalhes_especificos: dreamsValidationRules.detalhes_especificos,
        motivacao: dreamsValidationRules.motivacao
      };
    
    default:
      return {};
  }
};

// Custom validation messages
export const validationMessages = {
  nome: {
    required: 'Nome é obrigatório',
    minLength: 'Nome deve ter pelo menos 2 caracteres',
    pattern: 'Nome deve conter apenas letras'
  },
  idade: {
    required: 'Idade é obrigatória',
    pattern: 'Digite apenas números',
    custom: 'Idade deve estar entre 18 e 80 anos'
  },
  profissao: {
    required: 'Profissão é obrigatória',
    minLength: 'Profissão deve ter pelo menos 3 caracteres'
  },
  experiencia: {
    required: 'Experiência é obrigatória',
    minLength: 'Descreva sua experiência com pelo menos 10 caracteres'
  },
  objetivo_principal: {
    required: 'Objetivo principal é obrigatório',
    minLength: 'Descreva seu objetivo com pelo menos 10 caracteres'
  },
  categoria: {
    required: 'Categoria é obrigatória'
  },
  timeline: {
    required: 'Timeline é obrigatório'
  },
  prioridade: {
    required: 'Prioridade é obrigatória'
  },
  situacao_atual: {
    required: 'Situação atual é obrigatória',
    minLength: 'Descreva sua situação atual com pelo menos 20 caracteres'
  },
  recursos_disponiveis: {
    required: 'Recursos disponíveis é obrigatório',
    minLength: 'Descreva seus recursos com pelo menos 10 caracteres'
  },
  obstaculos: {
    required: 'Obstáculos é obrigatório',
    minLength: 'Descreva os obstáculos com pelo menos 10 caracteres'
  },
  detalhes_especificos: {
    required: 'Detalhes específicos são obrigatórios',
    minLength: 'Forneça detalhes específicos com pelo menos 20 caracteres'
  },
  motivacao: {
    required: 'Motivação é obrigatória',
    minLength: 'Descreva sua motivação com pelo menos 20 caracteres'
  }
};

// Smart suggestions for form fields
export const getFieldSuggestions = (fieldName: keyof CriadorSonhosFormData, value: string): string[] => {
  const suggestions: string[] = [];

  switch (fieldName) {
    case 'categoria':
      if (!value) {
        suggestions.push('Escolha: trabalho, estudo, investimento, família ou aposentadoria');
      }
      break;
    
    case 'prioridade':
      if (!value) {
        suggestions.push('Defina se é baixa, média ou alta prioridade');
      }
      break;
    
    case 'timeline':
      if (!value) {
        suggestions.push('Ex: "6 meses", "1 ano", "2-3 anos"');
      }
      break;
    
    case 'experiencia':
      if (value.length < 10) {
        suggestions.push('Inclua anos de experiência, principais conquistas e habilidades');
      }
      break;
    
    case 'objetivo_principal':
      if (value.length < 10) {
        suggestions.push('Seja específico sobre o que deseja alcançar nos EUA');
      }
      break;
    
    case 'situacao_atual':
      if (value.length < 20) {
        suggestions.push('Descreva sua situação profissional, familiar e financeira atual');
      }
      break;
    
    case 'recursos_disponiveis':
      if (value.length < 10) {
        suggestions.push('Inclua recursos financeiros, educacionais, profissionais e pessoais');
      }
      break;
    
    case 'obstaculos':
      if (value.length < 10) {
        suggestions.push('Mencione desafios como idioma, visto, financeiro ou profissional');
      }
      break;
    
    case 'detalhes_especificos':
      if (value.length < 20) {
        suggestions.push('Inclua preferências de localização, tipo de trabalho, estilo de vida');
      }
      break;
    
    case 'motivacao':
      if (value.length < 20) {
        suggestions.push('Explique o que o motiva e como isso mudará sua vida');
      }
      break;
  }

  return suggestions;
};
