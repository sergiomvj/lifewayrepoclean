import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  Info,
  Star,
  Clock,
  Target,
  Shield,
  TrendingUp,
  Send,
  Save,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveQuestionnaire } from '@/hooks/useAdaptiveQuestionnaire';
import { useIntelligentValidation } from '@/hooks/useIntelligentValidation';
import { FormData, QuestionDefinition } from '@/services/adaptiveQuestionnaireService';

interface AdaptiveQuestionnaireProps {
  flowId: string;
  title?: string;
  description?: string;
  onComplete?: (answers: any) => void;
  onProgress?: (progress: number) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'wizard' | 'embedded';
  showProgress?: boolean;
  showSuggestions?: boolean;
  autoAdvance?: boolean;
}

interface QuestionRendererProps {
  question: QuestionDefinition;
  value: any;
  onChange: (value: any) => void;
  onValidate?: (value: any) => void;
  error?: string[];
  suggestions?: string[];
  isValidating?: boolean;
}

// Componente para renderizar diferentes tipos de pergunta
const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  value,
  onChange,
  onValidate,
  error,
  suggestions,
  isValidating
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleAnswerChange = async (value: any) => {
    onChange(value);
    setLocalValue(value);
    
    // Validação inteligente em tempo real
    if (onValidate) {
      try {
        onValidate(value);
      } catch (error) {
        console.error('Erro na validação inteligente:', error);
      }
    }
  };

  const renderInput = () => {
    switch (question.type) {
      case 'text':
        return (
          <Input
            value={localValue || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={localValue || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
            rows={4}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={localValue || ''}
            onChange={(e) => handleAnswerChange(Number(e.target.value))}
            placeholder={question.placeholder}
            min={question.validation?.min}
            max={question.validation?.max}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'select':
        return (
          <Select value={localValue || ''} onValueChange={handleAnswerChange}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={question.placeholder || 'Selecione uma opção'} />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-sm text-muted-foreground">
                        {option.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'multiselect':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={Array.isArray(localValue) && localValue.includes(option.value)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(localValue) ? localValue : [];
                    if (checked) {
                      handleAnswerChange([...currentValues, option.value]);
                    } else {
                      handleAnswerChange(currentValues.filter(v => v !== option.value));
                    }
                  }}
                />
                <Label htmlFor={option.value} className="flex flex-col">
                  <span>{option.label}</span>
                  {option.description && (
                    <span className="text-sm text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <RadioGroup
            value={localValue?.toString() || ''}
            onValueChange={(value) => handleAnswerChange(value === 'true')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="yes" />
              <Label htmlFor="yes">Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="no" />
              <Label htmlFor="no">Não</Label>
            </div>
          </RadioGroup>
        );

      case 'scale':
        return (
          <div className="space-y-4">
            <Slider
              value={[localValue || question.validation?.min || 1]}
              onValueChange={(values) => handleAnswerChange(values[0])}
              min={question.validation?.min || 1}
              max={question.validation?.max || 10}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{question.validation?.min || 1}</span>
              <span className="font-medium">{localValue || question.validation?.min || 1}</span>
              <span>{question.validation?.max || 10}</span>
            </div>
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={localValue || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      default:
        return (
          <Input
            value={localValue || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder={question.placeholder}
            className={error ? 'border-red-500' : ''}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium flex items-center gap-2">
            {question.title}
            {question.required && <span className="text-red-500">*</span>}
            {isValidating && <RefreshCw className="h-4 w-4 animate-spin" />}
          </Label>
          {suggestions && suggestions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="text-blue-600"
            >
              <Lightbulb className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
      </div>

      {renderInput()}

      {/* Erros de validação */}
      {error && error.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {error.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Sugestões */}
      <AnimatePresence>
        {showSuggestions && suggestions && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {suggestions.map((suggestion, index) => (
              <Alert key={index} className="border-blue-200 bg-blue-50">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  {suggestion}
                </AlertDescription>
              </Alert>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Informações adicionais */}
      {question.metadata?.helpText && (
        <div className="text-sm text-muted-foreground">
          <Info className="h-4 w-4 inline mr-1" />
          {question.metadata.helpText}
        </div>
      )}

      {question.metadata?.examples && (
        <div className="text-sm text-muted-foreground">
          <strong>Exemplos:</strong> {question.metadata.examples.join(', ')}
        </div>
      )}
    </div>
  );
};

export const AdaptiveQuestionnaire: React.FC<AdaptiveQuestionnaireProps> = ({
  flowId,
  title = 'Questionário Adaptativo',
  description,
  onComplete,
  onProgress,
  className = '',
  variant = 'default',
  showProgress = true,
  showSuggestions = true,
  autoAdvance = false
}) => {
  const {
    questions,
    currentAnswers,
    progress,
    estimatedTimeRemaining,
    suggestions,
    isLoading,
    isSaving,
    isValidating,
    updateAnswer,
    validateAnswer,
    submitQuestionnaire,
    resetQuestionnaire,
    goToQuestion,
    getNextQuestion,
    getPreviousQuestion,
    validationResults,
    isQuestionValid,
    isQuestionnaireComplete,
    canSubmit,
    saveProgress,
    clearErrors,
    error,
    fieldErrors
  } = useAdaptiveQuestionnaire({ flowId });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  const currentQuestion = questions[currentQuestionIndex];
  const unansweredQuestions = questions.filter(q => !currentAnswers[q.id]);
  const nextQuestion = getNextQuestion();

  // Notificar progresso
  useEffect(() => {
    if (onProgress) {
      onProgress(progress);
    }
  }, [progress, onProgress]);

  // Auto-advance para próxima pergunta
  useEffect(() => {
    if (autoAdvance && currentQuestion && currentAnswers[currentQuestion.id] && isQuestionValid(currentQuestion.id)) {
      const timer = setTimeout(() => {
        handleNext();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentAnswers, currentQuestion, autoAdvance, isQuestionValid]);

  const handleAnswerChange = async (questionId: string, value: any) => {
    await updateAnswer(questionId, value);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await submitQuestionnaire();
      if (onComplete) {
        onComplete(currentAnswers);
      }
    } catch (error) {
      console.error('Erro ao submeter questionário:', error);
    }
  };

  const renderProgressSection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <span className="font-medium">Progresso</span>
        </div>
        <Badge variant="outline">
          {Object.keys(currentAnswers).length} de {questions.length}
        </Badge>
      </div>
      
      <Progress value={progress} className="h-2" />
      
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{progress}% concluído</span>
        {estimatedTimeRemaining > 0 && (
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{estimatedTimeRemaining} min restantes</span>
          </div>
        )}
      </div>
    </div>
  );



  const renderSingleQuestionView = () => (
    <div className="space-y-6">
      {currentQuestion && (
        <motion.div
          key={currentQuestion.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6"
        >
          <QuestionRenderer
            question={currentQuestion}
            value={currentAnswers[currentQuestion.id]}
            onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
            error={fieldErrors[currentQuestion.id]}
            suggestions={validationResults[currentQuestion.id]?.suggestions}
            isValidating={isValidating}
          />
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={saveProgress}
            disabled={isSaving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>

          {currentQuestionIndex < questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={currentQuestion && !isQuestionValid(currentQuestion.id)}
            >
              Próxima
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderSuggestionsSection = () => {
    if (!showSuggestions || !suggestions || suggestions.length === 0) {
      return null;
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium">Sugestões</span>
        </div>
        {suggestions.map((suggestion, index) => (
          <Alert key={index} className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {suggestion}
            </AlertDescription>
          </Alert>
        ))}
      </div>
    );
  };

  const renderAllQuestionsView = () => (
    <div className="space-y-8">
      {questions.map((question, index) => (
        <motion.div
          key={question.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <Badge variant={currentAnswers[question.id] ? 'default' : 'outline'}>
              {index + 1}
            </Badge>
            {currentAnswers[question.id] && (
              <CheckCircle className="h-4 w-4 text-green-600" />
            )}
          </div>

          <QuestionRenderer
            question={question}
            value={currentAnswers[question.id]}
            onChange={(value) => handleAnswerChange(question.id, value)}
            error={fieldErrors[question.id]}
            suggestions={validationResults[question.id]?.suggestions}
            isValidating={isValidating}
          />
        </motion.div>
      ))}

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!canSubmit}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          <Send className="h-4 w-4 mr-2" />
          Finalizar Questionário
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Carregando questionário...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-muted-foreground mt-2">{description}</p>
            )}
          </div>
          
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'single' | 'all')}>
            <TabsList>
              <TabsTrigger value="single">Uma por vez</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Seção de progresso */}
        {showProgress && renderProgressSection()}

        {/* Sugestões globais */}
        {renderSuggestionsSection()}

        {/* Erro global */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Conteúdo do questionário */}
        <Tabs value={viewMode}>
          <TabsContent value="single">
            {renderSingleQuestionView()}
          </TabsContent>
          <TabsContent value="all">
            {renderAllQuestionsView()}
          </TabsContent>
        </Tabs>

        {/* Ações adicionais */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={resetQuestionnaire}
            size="sm"
          >
            Recomeçar
          </Button>

          <div className="text-sm text-muted-foreground">
            {unansweredQuestions.length > 0 && (
              <span>{unansweredQuestions.length} pergunta(s) restante(s)</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Componente específico para Dreams
export const DreamsAdaptiveQuestionnaire: React.FC<Omit<AdaptiveQuestionnaireProps, 'flowId'>> = (props) => {
  return (
    <AdaptiveQuestionnaire
      {...props}
      flowId="dreams_adaptive"
      title="Criador de Sonhos Adaptativo"
      description="Conte-nos sobre seus sonhos e objetivos para criar um plano personalizado"
    />
  );
};

export default AdaptiveQuestionnaire;
