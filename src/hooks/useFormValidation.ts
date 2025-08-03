import { useState, useCallback, useMemo } from 'react';
import { ValidationRule, ValidationResult, ValidationError } from '@/types/forms';

interface UseFormValidationProps<T> {
  formData: T;
  rules: Record<keyof T, ValidationRule[]>;
  validateOnChange?: boolean;
  debounceMs?: number;
}

export function useFormValidation<T extends Record<string, any>>({
  formData,
  rules,
  validateOnChange = true,
  debounceMs = 300
}: UseFormValidationProps<T>) {
  const [errors, setErrors] = useState<Record<keyof T, ValidationError[]>>({} as Record<keyof T, ValidationError[]>);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isValidating, setIsValidating] = useState(false);

  // Validate a single field
  const validateField = useCallback((field: keyof T, value: any): ValidationError[] => {
    const fieldRules = rules[field] || [];
    const fieldErrors: ValidationError[] = [];

    for (const rule of fieldRules) {
      // Required validation
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        fieldErrors.push({
          field: String(field),
          message: `${String(field)} é obrigatório`,
          type: 'required'
        });
        continue;
      }

      // Skip other validations if field is empty and not required
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        continue;
      }

      // Length validations
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        fieldErrors.push({
          field: String(field),
          message: `${String(field)} deve ter pelo menos ${rule.minLength} caracteres`,
          type: 'length'
        });
      }

      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        fieldErrors.push({
          field: String(field),
          message: `${String(field)} deve ter no máximo ${rule.maxLength} caracteres`,
          type: 'length'
        });
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        fieldErrors.push({
          field: String(field),
          message: getPatternErrorMessage(String(field), rule.pattern),
          type: 'format'
        });
      }

      // Custom validation
      if (rule.custom) {
        const customResult = rule.custom(value, formData);
        if (typeof customResult === 'string') {
          fieldErrors.push({
            field: String(field),
            message: customResult,
            type: 'custom'
          });
        } else if (customResult === false) {
          fieldErrors.push({
            field: String(field),
            message: `${String(field)} é inválido`,
            type: 'custom'
          });
        }
      }
    }

    return fieldErrors;
  }, [rules, formData]);

  // Get pattern error message
  const getPatternErrorMessage = (field: string, pattern: RegExp): string => {
    const patternMessages: Record<string, string> = {
      email: 'Digite um email válido',
      phone: 'Digite um telefone válido',
      cpf: 'Digite um CPF válido',
      age: 'Digite uma idade válida',
      number: 'Digite apenas números',
      text: 'Digite apenas letras',
      alphanumeric: 'Digite apenas letras e números'
    };

    // Try to match common patterns
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    const numberPattern = /^\d+$/;
    const textPattern = /^[a-zA-ZÀ-ÿ\s]+$/;
    const alphanumericPattern = /^[a-zA-Z0-9À-ÿ\s]+$/;

    if (pattern.source === emailPattern.source) return patternMessages.email;
    if (pattern.source === phonePattern.source) return patternMessages.phone;
    if (pattern.source === cpfPattern.source) return patternMessages.cpf;
    if (pattern.source === numberPattern.source) return patternMessages.number;
    if (pattern.source === textPattern.source) return patternMessages.text;
    if (pattern.source === alphanumericPattern.source) return patternMessages.alphanumeric;

    return `Formato inválido para ${field}`;
  };

  // Validate all fields
  const validateAll = useCallback((): ValidationResult => {
    setIsValidating(true);
    const allErrors: Record<keyof T, ValidationError[]> = {} as Record<keyof T, ValidationError[]>;
    let hasErrors = false;

    Object.keys(formData).forEach(key => {
      const field = key as keyof T;
      const fieldErrors = validateField(field, formData[field]);
      allErrors[field] = fieldErrors;
      if (fieldErrors.length > 0) {
        hasErrors = true;
      }
    });

    setErrors(allErrors);
    setIsValidating(false);

    return {
      isValid: !hasErrors,
      errors: Object.values(allErrors).flat()
    };
  }, [formData, validateField]);

  // Validate specific field with debounce
  const validateFieldDebounced = useCallback((field: keyof T, value: any) => {
    const timeoutId = setTimeout(() => {
      const fieldErrors = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: fieldErrors
      }));
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [validateField, debounceMs]);

  // Mark field as touched
  const touchField = useCallback((field: keyof T) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));
  }, []);

  // Get field error
  const getFieldError = useCallback((field: keyof T): string | undefined => {
    const fieldErrors = errors[field] || [];
    return fieldErrors.length > 0 ? fieldErrors[0].message : undefined;
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((field: keyof T): boolean => {
    const fieldErrors = errors[field] || [];
    return fieldErrors.length > 0;
  }, [errors]);

  // Check if field is touched
  const isFieldTouched = useCallback((field: keyof T): boolean => {
    return touched[field] || false;
  }, [touched]);

  // Get field validation state
  const getFieldState = useCallback((field: keyof T) => {
    const hasError = hasFieldError(field);
    const isTouched = isFieldTouched(field);
    
    return {
      hasError,
      isTouched,
      error: getFieldError(field),
      isValid: !hasError && isTouched,
      showError: hasError && isTouched
    };
  }, [hasFieldError, isFieldTouched, getFieldError]);

  // Clear field error
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => ({
      ...prev,
      [field]: []
    }));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors({} as Record<keyof T, ValidationError[]>);
    setTouched({} as Record<keyof T, boolean>);
  }, []);

  // Get form validation summary
  const validationSummary = useMemo(() => {
    const allErrors = Object.values(errors).flat();
    const touchedFields = Object.values(touched).filter(Boolean).length;
    const totalFields = Object.keys(formData).length;
    
    return {
      isValid: allErrors.length === 0,
      errorCount: allErrors.length,
      touchedFieldsCount: touchedFields,
      totalFields,
      completionPercentage: totalFields > 0 ? (touchedFields / totalFields) * 100 : 0,
      errors: allErrors
    };
  }, [errors, touched, formData]);

  // Smart validation suggestions
  const getValidationSuggestions = useCallback((field: keyof T): string[] => {
    const suggestions: string[] = [];
    const fieldRules = rules[field] || [];
    const value = formData[field];

    for (const rule of fieldRules) {
      if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        suggestions.push(`Este campo é obrigatório`);
      }

      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        const remaining = rule.minLength - value.length;
        suggestions.push(`Adicione mais ${remaining} caractere${remaining > 1 ? 's' : ''}`);
      }

      if (rule.pattern && typeof value === 'string' && value.length > 0 && !rule.pattern.test(value)) {
        // Provide specific suggestions based on pattern
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (rule.pattern.source === emailPattern.source) {
          if (!value.includes('@')) {
            suggestions.push('Adicione o símbolo @');
          } else if (!value.includes('.')) {
            suggestions.push('Adicione um domínio válido (ex: .com)');
          }
        }
      }
    }

    return suggestions;
  }, [rules, formData]);

  return {
    errors,
    touched,
    isValidating,
    validateField,
    validateAll,
    validateFieldDebounced,
    touchField,
    getFieldError,
    hasFieldError,
    isFieldTouched,
    getFieldState,
    clearFieldError,
    clearAllErrors,
    validationSummary,
    getValidationSuggestions
  };
}

// Common validation rules
export const commonValidationRules = {
  required: { required: true },
  email: { 
    required: true, 
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  phone: { 
    pattern: /^\(\d{2}\)\s\d{4,5}-\d{4}$/
  },
  cpf: { 
    pattern: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
  },
  age: { 
    required: true,
    pattern: /^\d+$/,
    custom: (value: string) => {
      const age = parseInt(value);
      return age >= 0 && age <= 120 ? true : 'Idade deve estar entre 0 e 120 anos';
    }
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-ZÀ-ÿ\s]+$/
  },
  text: {
    minLength: 10,
    maxLength: 1000
  },
  shortText: {
    maxLength: 255
  }
};

export default useFormValidation;
