import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Target, 
  Zap,
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';

// Score calculation interfaces
interface ScoreFactors {
  completeness: number;
  timeline: number;
  feasibility: number;
  cost: number;
  priority: number;
}

interface ScoreBreakdown {
  total: number;
  factors: ScoreFactors;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
  color: string;
  recommendations: string[];
}

interface VisualScoringProps {
  type: 'dream' | 'visa';
  data: any;
  className?: string;
  showBreakdown?: boolean;
  compact?: boolean;
}

const VisualScoring: React.FC<VisualScoringProps> = ({ 
  type, 
  data, 
  className = '', 
  showBreakdown = true,
  compact = false 
}) => {
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const breakdown = calculateScore(type, data);
    setScoreBreakdown(breakdown);
    
    // Trigger animation
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [type, data]);

  const calculateScore = (scoreType: 'dream' | 'visa', itemData: any): ScoreBreakdown => {
    if (scoreType === 'dream') {
      return calculateDreamScore(itemData);
    } else {
      return calculateVisaScore(itemData);
    }
  };

  const calculateDreamScore = (dream: any): ScoreBreakdown => {
    const factors: ScoreFactors = {
      completeness: 0,
      timeline: 0,
      feasibility: 0,
      cost: 0,
      priority: 0
    };

    const recommendations: string[] = [];

    // Completeness (40% weight)
    const formData = dream.form_data || dream;
    const requiredFields = ['nome', 'objetivo_principal', 'categoria', 'timeline', 'situacao_atual'];
    const completedFields = requiredFields.filter(field => formData[field] && formData[field].trim() !== '');
    factors.completeness = (completedFields.length / requiredFields.length) * 100;
    
    if (factors.completeness < 80) {
      recommendations.push('Complete todos os campos obrigatórios para melhorar seu score');
    }

    // Timeline feasibility (25% weight)
    const timeline = formData.timeline?.toLowerCase() || '';
    if (timeline.includes('imediatamente') || timeline.includes('6 meses')) {
      factors.timeline = 60; // Challenging but possible
      recommendations.push('Timeline agressivo - considere preparação intensiva');
    } else if (timeline.includes('1 ano')) {
      factors.timeline = 85; // Realistic
    } else if (timeline.includes('2') || timeline.includes('3')) {
      factors.timeline = 95; // Very realistic
    } else {
      factors.timeline = 50;
      recommendations.push('Defina um timeline mais específico');
    }

    // Feasibility based on profile (20% weight)
    const profissao = formData.profissao?.toLowerCase() || '';
    const experiencia = formData.experiencia?.toLowerCase() || '';
    
    if (profissao.includes('engenheiro') || profissao.includes('médico') || profissao.includes('advogado')) {
      factors.feasibility = 90; // High-demand professions
    } else if (profissao.includes('tecnologia') || profissao.includes('ti')) {
      factors.feasibility = 85;
    } else if (profissao) {
      factors.feasibility = 70;
    } else {
      factors.feasibility = 40;
      recommendations.push('Defina sua profissão para análise mais precisa');
    }

    if (experiencia.includes('10+') || experiencia.includes('mais de 10')) {
      factors.feasibility += 10;
    } else if (experiencia.includes('6-10')) {
      factors.feasibility += 5;
    }

    // Cost consideration (10% weight)
    const recursos = formData.recursos_disponiveis?.toLowerCase() || '';
    if (recursos.includes('50') && recursos.includes('mil')) {
      factors.cost = 90;
    } else if (recursos.includes('20') && recursos.includes('mil')) {
      factors.cost = 70;
    } else if (recursos.includes('10') && recursos.includes('mil')) {
      factors.cost = 50;
      recommendations.push('Considere aumentar reserva financeira');
    } else {
      factors.cost = 30;
      recommendations.push('Planeje recursos financeiros adequados');
    }

    // Priority impact (5% weight)
    const prioridade = formData.prioridade || '';
    if (prioridade === 'alta') {
      factors.priority = 100;
    } else if (prioridade === 'media') {
      factors.priority = 75;
    } else {
      factors.priority = 50;
    }

    // Calculate weighted total
    const total = Math.round(
      (factors.completeness * 0.4) +
      (factors.timeline * 0.25) +
      (factors.feasibility * 0.2) +
      (factors.cost * 0.1) +
      (factors.priority * 0.05)
    );

    // Additional recommendations based on total score
    if (total < 60) {
      recommendations.push('Foque em completar seu perfil e definir objetivos claros');
    } else if (total < 80) {
      recommendations.push('Bom progresso! Refine seu plano para melhores resultados');
    } else {
      recommendations.push('Excelente perfil! Você está no caminho certo');
    }

    return {
      total,
      factors,
      grade: getGrade(total),
      color: getScoreColor(total),
      recommendations: recommendations.slice(0, 3) // Limit to 3 recommendations
    };
  };

  const calculateVisaScore = (visa: any): ScoreBreakdown => {
    const factors: ScoreFactors = {
      completeness: visa.match || 0,
      timeline: 0,
      feasibility: 0,
      cost: 0,
      priority: 0
    };

    const recommendations: string[] = [];

    // Timeline score
    const timeline = visa.timeline?.toLowerCase() || '';
    if (timeline.includes('6') && timeline.includes('month')) {
      factors.timeline = 95;
    } else if (timeline.includes('1') && timeline.includes('year')) {
      factors.timeline = 85;
    } else if (timeline.includes('2') && timeline.includes('year')) {
      factors.timeline = 70;
    } else {
      factors.timeline = 50;
    }

    // Cost score (inverse - lower cost = higher score)
    const cost = visa.cost?.toLowerCase() || '';
    if (cost.includes('1,000') || cost.includes('2,000')) {
      factors.cost = 95;
    } else if (cost.includes('3,000') || cost.includes('5,000')) {
      factors.cost = 80;
    } else if (cost.includes('10,000')) {
      factors.cost = 65;
    } else if (cost.includes('50,000')) {
      factors.cost = 40;
      recommendations.push('Considere opções de menor investimento inicial');
    } else {
      factors.cost = 60;
    }

    // Feasibility based on requirements
    const requirements = visa.requirements || [];
    if (requirements.length <= 3) {
      factors.feasibility = 90;
    } else if (requirements.length <= 5) {
      factors.feasibility = 75;
    } else {
      factors.feasibility = 60;
      recommendations.push('Visto com muitos requisitos - prepare-se adequadamente');
    }

    // Priority based on visa type
    const visaType = visa.type?.toLowerCase() || '';
    if (visaType.includes('h1-b') || visaType.includes('l-1')) {
      factors.priority = 90; // High-priority work visas
    } else if (visaType.includes('o-1')) {
      factors.priority = 85; // Extraordinary ability
    } else if (visaType.includes('e-2')) {
      factors.priority = 80; // Investor visa
    } else {
      factors.priority = 70;
    }

    // Calculate weighted total
    const total = Math.round(
      (factors.completeness * 0.4) +
      (factors.timeline * 0.2) +
      (factors.feasibility * 0.2) +
      (factors.cost * 0.1) +
      (factors.priority * 0.1)
    );

    // Add specific recommendations
    if (factors.completeness < 70) {
      recommendations.push('Melhore seu perfil para aumentar compatibilidade');
    }
    if (factors.timeline < 70) {
      recommendations.push('Timeline longo - considere alternativas mais rápidas');
    }
    if (total >= 80) {
      recommendations.push('Excelente opção de visto para seu perfil!');
    }

    return {
      total,
      factors,
      grade: getGrade(total),
      color: getScoreColor(total),
      recommendations: recommendations.slice(0, 3)
    };
  };

  const getGrade = (score: number): ScoreBreakdown['grade'] => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getScoreColor = (score: number): string => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeColor = (grade: string): string => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800 border-green-200';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (grade === 'D') return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getFactorIcon = (factor: keyof ScoreFactors) => {
    switch (factor) {
      case 'completeness': return <CheckCircle className="w-4 h-4" />;
      case 'timeline': return <Clock className="w-4 h-4" />;
      case 'feasibility': return <Target className="w-4 h-4" />;
      case 'cost': return <DollarSign className="w-4 h-4" />;
      case 'priority': return <Star className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getFactorName = (factor: keyof ScoreFactors): string => {
    const names = {
      completeness: 'Completude',
      timeline: 'Timeline',
      feasibility: 'Viabilidade',
      cost: 'Custo',
      priority: 'Prioridade'
    };
    return names[factor];
  };

  if (!scoreBreakdown) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          <div className={`text-2xl font-bold ${scoreBreakdown.color}`}>
            {scoreBreakdown.total}
          </div>
          <Badge className={`${getGradeColor(scoreBreakdown.grade)} border`}>
            {scoreBreakdown.grade}
          </Badge>
        </div>
        <Progress 
          value={scoreBreakdown.total} 
          className="flex-1 h-2"
        />
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-600" />
            Score de {type === 'dream' ? 'Sonho' : 'Visto'}
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-3xl font-bold ${scoreBreakdown.color} ${isAnimating ? 'animate-pulse' : ''}`}>
              {scoreBreakdown.total}
            </div>
            <Badge className={`${getGradeColor(scoreBreakdown.grade)} border text-lg px-3 py-1`}>
              {scoreBreakdown.grade}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Score Geral</span>
            <span className="text-sm text-gray-500">{scoreBreakdown.total}/100</span>
          </div>
          <Progress 
            value={scoreBreakdown.total} 
            className="h-3"
          />
        </div>

        {/* Factor Breakdown */}
        {showBreakdown && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700">Análise Detalhada</h4>
            {Object.entries(scoreBreakdown.factors).map(([factor, score]) => (
              <div key={factor} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getFactorIcon(factor as keyof ScoreFactors)}
                  <span className="text-sm">{getFactorName(factor as keyof ScoreFactors)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Progress value={score} className="h-2" />
                  </div>
                  <span className="text-sm font-medium w-8">{Math.round(score)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {scoreBreakdown.recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              Recomendações
            </h4>
            <div className="space-y-1">
              {scoreBreakdown.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score Trend Indicator */}
        <div className="flex items-center justify-center pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            {scoreBreakdown.total >= 80 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">Excelente Performance</span>
              </>
            ) : scoreBreakdown.total >= 60 ? (
              <>
                <BarChart3 className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-600 font-medium">Bom Potencial</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-red-600 font-medium">Precisa Melhorar</span>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VisualScoring;
