import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Save, AlertCircle, Clock, Wifi, WifiOff, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useFormValidation, commonValidationRules } from '@/hooks/useFormValidation';
import { ValidationRule, AutoSaveConfig } from '@/types/forms';
import { useToast } from '@/hooks/use-toast';

export interface FormStep<T> {
  id: string;
  title: string;
  description: string;
  fields: (keyof T)[];
  icon?: React.ReactNode;
  isCompleted?: boolean;
  isOptional?: boolean;
  component: (props: {
    formData: T;
    updateFormData: (field: keyof T, value: any) => void;
    getFieldState: (field: keyof T) => any;
    getValidationSuggestions: (field: keyof T) => any;
    validationSummary: any;
  }) => React.ReactNode;
}

export interface MultistepFormProps<T> {
  steps: FormStep<T>[];
  initialData: T;
  onSubmit: (data: T) => Promise<void>;
  onStepChange?: (step: number, data: T) => void;
  className?: string;
  title?: string;
  description?: string;
  validationRules?: Record<keyof T, ValidationRule[]>;
  autoSaveConfig?: AutoSaveConfig;
  tableName?: string;
  userId?: string;
  recordId?: string;
}

export function MultistepForm<T extends Record<string, any>>({
  steps,
  initialData,
  onSubmit,
  onStepChange,
  className,
  title,
  description,
  validationRules = {} as Record<keyof T, ValidationRule[]>,
  autoSaveConfig = {
    enabled: true,
    interval: 30000, // 30 seconds
    storage: 'localStorage',
    key_prefix: 'lifeway_form'
  },
  tableName = 'form_drafts',
  userId,
  recordId
}: MultistepFormProps<T>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<T>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const { toast } = useToast();

  // Form persistence hook
  const {
    saveState,
    saveNow,
    loadSavedData,
    clearSavedData,
    formatLastSaved
  } = useFormPersistence({
    formData,
    config: autoSaveConfig,
    tableName,
    userId,
    recordId
  });

  // Form validation hook
  const {
    validateAll,
    validateField,
    touchField,
    getFieldState,
    validationSummary,
    getValidationSuggestions
  } = useFormValidation({
    formData,
    rules: validationRules,
    validateOnChange: true,
    debounceMs: 300
  });

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const updateFormData = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    touchField(field);

    // Real-time validation for the field
    setTimeout(() => {
      validateField(field, value);
    }, 300);
  }, [touchField, validateField]);

  const validateCurrentStep = useCallback(() => {
    const currentStepFields = currentStepData.fields;
    let isValid = true;

    for (const field of currentStepFields) {
      const fieldKey = field as keyof T;
      const fieldRules = validationRules[fieldKey] || [];
      const hasRequiredRule = fieldRules.some(rule => rule.required);
      
      // Only check if required fields are filled - ignore other validation errors for step progression
      if (hasRequiredRule && (!formData[fieldKey] || formData[fieldKey] === '')) {
        isValid = false;
        break;
      }
    }

    return isValid;
  }, [currentStepData, validationRules, formData]);

  const goToNextStep = useCallback(() => {
    // Validate current step before proceeding
    if (!validateCurrentStep()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));

      // Mark current step as completed
      setCompletedSteps(prev => new Set([...prev, currentStep]));

      onStepChange?.(nextStep, formData);
    }
  }, [currentStep, steps.length, formData, onStepChange, validateCurrentStep, toast]);

  const handleSubmit = useCallback(async () => {
    // Final validation
    const validation = validateAll();
    if (!validation.isValid) {
      toast({
        title: "Formulário incompleto",
        description: `Existem ${validation.errors.length} erro(s) que precisam ser corrigidos.`,
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      clearSavedData(); // Clear saved data after successful submission
      toast({
        title: "Sucesso!",
        description: "Formulário enviado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao enviar formulário:', error);
      toast({
        title: "Erro ao enviar",
        description: "Ocorreu um erro ao enviar o formulário. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSubmit, currentStep, validateAll, clearSavedData, toast]);

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(prev => Math.max(prev - 1, 0));
    }
  }, [isFirstStep]);

  const canProceedToStep = useCallback((stepIndex: number) => {
    if (stepIndex <= currentStep) return true;

    // Check if all previous steps are completed
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(i)) return false;
    }
    return true;
  }, [currentStep, completedSteps]);

  return (
    <div className={cn("max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", className)}>
      {/* Step Indicator */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
          {steps.map((step, index) => {
            const status = canProceedToStep(index) ? 'completed' : 'pending';
            return (
              <div key={step.id} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setCurrentStep(index)}
                  className={cn(
                    "flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all duration-200",
                    status === 'completed' && "bg-green-500 border-green-500 text-white",
                    status === 'pending' && "bg-white border-gray-300 text-gray-400"
                  )}
                >
                  {status === 'completed' ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                  )}
                </button>

                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-8 sm:w-16 h-0.5 mx-1 sm:mx-2",
                    index < currentStep ? "bg-green-500" : "bg-gray-300"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center px-2">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">{currentStepData.description}</p>
          {currentStepData.isOptional && (
            <Badge variant="outline" className="mt-2 text-xs">Opcional</Badge>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm text-gray-600">
            Etapa {currentStep + 1} de {steps.length}
          </span>
          <span className="text-xs sm:text-sm text-gray-600">
            {Math.round(progress)}% concluído
          </span>
        </div>
        <Progress value={progress} className="h-1.5 sm:h-2" />
      </div>

      {/* Auto-save Status */}
      {autoSaveConfig.enabled && (
        <div className="flex items-center justify-end mb-4 text-xs text-gray-500">
          {saveState.is_saving ? (
            <div className="flex items-center">
              <Save className="w-3 h-3 mr-1 animate-spin" />
              Salvando...
            </div>
          ) : saveState.last_saved ? (
            <div className="flex items-center">
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
              {formatLastSaved()}
            </div>
          ) : null}
        </div>
      )}

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {currentStepData.icon && <span className="mr-2">{currentStepData.icon}</span>}
            {currentStepData.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepData.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {currentStepData.component({
                formData,
                updateFormData,
                getFieldState,
                getValidationSuggestions,
                validationSummary
              })}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center pt-4 sm:pt-6 mt-4 sm:mt-6 border-t gap-3 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={isFirstStep}
              className="flex items-center justify-center order-2 sm:order-1"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Anterior
            </Button>

            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 order-1 sm:order-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={saveNow}
                disabled={saveState.is_saving || !saveState.has_unsaved_changes}
                className="flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                {saveState.is_saving ? 'Salvando...' : 'Salvar'}
              </Button>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || validationSummary.errorCount > 0}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Finalizar'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={goToNextStep}
                  disabled={!validateCurrentStep()}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto"
                  size="sm"
                >
                  Próximo →
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MultistepForm;
