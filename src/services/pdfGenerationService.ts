import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { CriadorSonhosFormData } from '@/types/forms';
import { UserProfile } from '@/types/userContext';
import { supabase } from '@/integrations/supabase/client';

interface PDFGenerationOptions {
  formData: CriadorSonhosFormData;
  aiAnalysis: string;
  userProfile: UserProfile;
  selectedImages: string[];
  template: 'standard' | 'premium';
}

interface PDFAccessControl {
  launchDate: Date;
  freePeriodDays: number;
  userType: 'FREE' | 'PRO';
  canAccessPDF: boolean;
  daysRemaining?: number;
  upgradeRequired?: boolean;
}

interface PDFSection {
  title: string;
  content: string;
  images?: string[];
  pageBreak?: boolean;
}

interface FamilyImage {
  id: string;
  filename: string;
  category: 'family' | 'lifestyle' | 'destination';
  tags: string[];
  url: string;
}

interface PDFTemplate {
  id: string;
  name: string;
  type: 'standard' | 'premium';
  sections: string[];
  features: string[];
  watermark?: boolean;
}

interface PDFGenerationResult {
  success: boolean;
  pdfBlob?: Blob;
  downloadUrl?: string;
  error?: string;
  accessControl: PDFAccessControl;
  metadata: {
    generatedAt: Date;
    template: string;
    pageCount: number;
    fileSize: number;
  };
}

class PDFGenerationService {
  private readonly LAUNCH_DATE = new Date('2025-08-01');
  private readonly FREE_PERIOD_DAYS = 60;
  
  // Templates disponíveis
  private readonly PDF_TEMPLATES: PDFTemplate[] = [
    {
      id: 'standard',
      name: 'Relatório Padrão',
      type: 'standard',
      sections: ['capa', 'visao_inspiradora', 'mapeamento_sonhos', 'cenarios', 'timeline', 'ferramentas'],
      features: ['Imagens de família', 'Análise básica', 'Layout limpo'],
      watermark: false
    },
    {
      id: 'premium',
      name: 'Relatório Premium',
      type: 'premium',
      sections: ['capa', 'visao_inspiradora', 'mapeamento_sonhos', 'cenarios', 'timeline', 'ferramentas', 'proximos_passos', 'recursos_extras'],
      features: ['Imagens premium', 'Análise detalhada', 'Layout profissional', 'Navegação avançada', 'Recursos extras'],
      watermark: false
    }
  ];

  /**
   * Verifica se o usuário tem acesso ao PDF baseado na estratégia de monetização
   */
  async checkPDFAccess(userId: string): Promise<PDFAccessControl> {
    try {
      // Buscar dados do usuário
      const user = await this.getUserData(userId);
      const currentDate = new Date();
      const daysSinceLaunch = Math.floor(
        (currentDate.getTime() - this.LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Período gratuito (60 dias)
      if (daysSinceLaunch <= this.FREE_PERIOD_DAYS) {
        return {
          launchDate: this.LAUNCH_DATE,
          freePeriodDays: this.FREE_PERIOD_DAYS,
          userType: user.subscription_type || 'FREE',
          canAccessPDF: true,
          daysRemaining: this.FREE_PERIOD_DAYS - daysSinceLaunch
        };
      }

      // Após período gratuito - apenas PRO
      if (user.subscription_type === 'PRO') {
        return {
          launchDate: this.LAUNCH_DATE,
          freePeriodDays: this.FREE_PERIOD_DAYS,
          userType: 'PRO',
          canAccessPDF: true
        };
      }

      // Usuário FREE após período gratuito
      return {
        launchDate: this.LAUNCH_DATE,
        freePeriodDays: this.FREE_PERIOD_DAYS,
        userType: 'FREE',
        canAccessPDF: false,
        upgradeRequired: true
      };
    } catch (error) {
      console.error('Erro ao verificar acesso ao PDF:', error);
      throw new Error('Falha na verificação de acesso ao PDF');
    }
  }

  /**
   * Gera o PDF do Criador de Sonhos com layout elegante
   */
  async generateDreamsPDF(options: PDFGenerationOptions): Promise<Blob> {
    const { formData, aiAnalysis, userProfile, selectedImages, template } = options;

    try {
      // Verificar acesso antes de gerar
      const accessControl = await this.checkPDFAccess(userProfile.id);
      if (!accessControl.canAccessPDF) {
        throw new Error('Acesso ao PDF não autorizado. Upgrade para PRO necessário.');
      }

      // Criar instância do PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Configurar fontes e estilos
      await this.setupPDFStyles(pdf, template);

      // Estruturar conteúdo baseado na análise de IA
      const sections = this.structurePDFContent(formData, aiAnalysis, selectedImages);

      // Gerar cada seção
      let currentPage = 1;
      for (const section of sections) {
        if (currentPage > 1 && section.pageBreak) {
          pdf.addPage();
        }
        
        await this.renderPDFSection(pdf, section, template);
        currentPage++;
      }

      // Adicionar rodapé com branding
      this.addPDFFooter(pdf, template, accessControl.userType);

      // Retornar blob do PDF
      return pdf.output('blob');
    } catch (error) {
      console.error('Erro na geração do PDF:', error);
      throw new Error('Falha na geração do PDF');
    }
  }

  /**
   * Seleciona imagens familiares baseadas no perfil
   */
  async selectFamilyImages(formData: CriadorSonhosFormData): Promise<string[]> {
    try {
      const familyProfile = this.extractFamilyProfile(formData);
      const availableImages = await this.getFamilyImagePool();
      
      // Algoritmo de seleção inteligente
      const selectedImages = this.smartImageSelection({
        familySize: familyProfile.members?.length || 2,
        ageGroups: familyProfile.ageDistribution || ['adult'],
        lifestyle: familyProfile.currentLifestyle || 'suburban',
        targetLifestyle: familyProfile.desiredLifestyle || 'suburban',
        interests: familyProfile.interests || [],
        targetState: formData.cidades_interesse?.[0] || 'California'
      }, availableImages);

      return selectedImages.slice(0, 8); // Máximo 8 imagens por PDF
    } catch (error) {
      console.error('Erro na seleção de imagens:', error);
      return this.getDefaultImages();
    }
  }

  /**
   * Estrutura o conteúdo do PDF baseado na análise de IA
   */
  private structurePDFContent(
    formData: CriadorSonhosFormData, 
    aiAnalysis: string, 
    images: string[]
  ): PDFSection[] {
    // Parse da análise de IA para extrair seções estruturadas
    const parsedAnalysis = this.parseAIAnalysis(aiAnalysis);

    return [
      {
        title: 'Capa - Sua Jornada Americana',
        content: this.generateCoverContent(formData),
        images: [images[0]],
        pageBreak: false
      },
      {
        title: 'Visão Geral da Família',
        content: parsedAnalysis.familyOverview || 'Análise do perfil familiar...',
        images: [images[1], images[2]],
        pageBreak: true
      },
      {
        title: 'Mapeamento de Sonhos',
        content: parsedAnalysis.dreamMapping || 'Mapeamento dos objetivos...',
        images: [images[3]],
        pageBreak: true
      },
      {
        title: 'Cenários de Transformação',
        content: parsedAnalysis.transformationScenarios || 'Três cenários possíveis...',
        images: [images[4], images[5]],
        pageBreak: true
      },
      {
        title: 'Timeline de Implementação',
        content: parsedAnalysis.timeline || 'Cronograma detalhado...',
        images: [images[6]],
        pageBreak: true
      },
      {
        title: 'Ferramentas Práticas',
        content: parsedAnalysis.practicalTools || 'Recursos e próximos passos...',
        images: [images[7]],
        pageBreak: true
      }
    ];
  }

  /**
   * Algoritmo inteligente de seleção de imagens
   */
  private smartImageSelection(
    criteria: {
      familySize: number;
      ageGroups: string[];
      lifestyle: string;
      targetLifestyle: string;
      interests: string[];
      targetState: string;
    },
    imagePool: Array<{
      url: string;
      metadata: {
        familySize: number;
        ageGroups: string[];
        lifestyle: string;
        location: string;
        tags: string[];
        emotionalTone: string;
      };
    }>
  ): string[] {
    return imagePool
      .map(image => ({
        ...image,
        score: this.calculateImageScore(criteria, image.metadata)
      }))
      .sort((a, b) => b.score - a.score)
      .map(image => image.url);
  }

  /**
   * Calcula score de compatibilidade da imagem
   */
  private calculateImageScore(criteria: any, metadata: any): number {
    let score = 0;

    // Compatibilidade de tamanho familiar (peso: 25%)
    const familySizeDiff = Math.abs(criteria.familySize - metadata.familySize);
    score += (1 - familySizeDiff / 5) * 25;

    // Compatibilidade de lifestyle (peso: 30%)
    if (criteria.targetLifestyle === metadata.lifestyle) {
      score += 30;
    } else if (criteria.lifestyle === metadata.lifestyle) {
      score += 15;
    }

    // Compatibilidade geográfica (peso: 20%)
    if (metadata.location.includes(criteria.targetState)) {
      score += 20;
    }

    // Compatibilidade de interesses (peso: 15%)
    const commonInterests = criteria.interests.filter(
      interest => metadata.tags.includes(interest)
    ).length;
    score += (commonInterests / criteria.interests.length) * 15;

    // Diversidade (peso: 10%)
    score += Math.random() * 10; // Adiciona elemento de diversidade

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Configura estilos do PDF
   */
  private async setupPDFStyles(pdf: jsPDF, template: 'standard' | 'premium'): Promise<void> {
    // Configurar cores baseadas no template
    const colors = template === 'premium' ? {
      primary: '#1e40af',
      secondary: '#3b82f6',
      accent: '#f59e0b',
      text: '#1f2937'
    } : {
      primary: '#374151',
      secondary: '#6b7280',
      accent: '#10b981',
      text: '#111827'
    };

    // Adicionar fontes customizadas se necessário
    // pdf.addFont('custom-font.ttf', 'CustomFont', 'normal');
  }

  /**
   * Renderiza uma seção do PDF
   */
  private async renderPDFSection(
    pdf: jsPDF, 
    section: PDFSection, 
    template: 'standard' | 'premium'
  ): Promise<void> {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;

    // Título da seção
    pdf.setFontSize(18);
    pdf.setTextColor(template === 'premium' ? '#1e40af' : '#374151');
    pdf.text(section.title, margin, margin + 10);

    // Conteúdo da seção
    pdf.setFontSize(12);
    pdf.setTextColor('#1f2937');
    
    const lines = pdf.splitTextToSize(section.content, pageWidth - 2 * margin);
    pdf.text(lines, margin, margin + 25);

    // Adicionar imagens se disponíveis
    if (section.images && section.images.length > 0) {
      await this.addImagesToSection(pdf, section.images, template);
    }
  }

  /**
   * Adiciona imagens à seção do PDF
   */
  private async addImagesToSection(
    pdf: jsPDF, 
    images: string[], 
    template: 'standard' | 'premium'
  ): Promise<void> {
    // Implementar lógica de adição de imagens
    // Considerar layout, redimensionamento e posicionamento
    const imageWidth = 60;
    const imageHeight = 40;
    let xPos = 20;
    let yPos = 100;

    for (const imageUrl of images) {
      try {
        // Carregar e adicionar imagem
        // pdf.addImage(imageUrl, 'JPEG', xPos, yPos, imageWidth, imageHeight);
        xPos += imageWidth + 10;
        
        if (xPos > 150) {
          xPos = 20;
          yPos += imageHeight + 10;
        }
      } catch (error) {
        console.warn('Erro ao adicionar imagem:', error);
      }
    }
  }

  /**
   * Adiciona rodapé com branding
   */
  private addPDFFooter(pdf: jsPDF, template: 'standard' | 'premium', userType: string): void {
    const pageCount = pdf.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      
      // Rodapé
      pdf.setFontSize(8);
      pdf.setTextColor('#6b7280');
      
      const footerText = template === 'premium' 
        ? `LifeWay USA Journey - Relatório Premium | Página ${i} de ${pageCount}`
        : `LifeWay USA Journey | Página ${i} de ${pageCount}`;
        
      pdf.text(footerText, 20, 285);
      
      // Marca d'água para usuários FREE
      if (userType === 'FREE') {
        pdf.setTextColor('#e5e7eb');
        pdf.setFontSize(6);
        pdf.text('Versão Gratuita - Upgrade para PRO para recursos avançados', 20, 290);
      }
    }
  }

  /**
   * Métodos auxiliares
   */
  private async getUserData(userId: string): Promise<any> {
    // Implementar busca de dados do usuário no Supabase
    return { subscription_type: 'FREE' }; // Mock
  }

  private extractFamilyProfile(formData: CriadorSonhosFormData): any {
    return {
      members: [],
      ageDistribution: ['adult'],
      currentLifestyle: 'suburban',
      desiredLifestyle: 'suburban',
      interests: []
    };
  }

  private async getFamilyImagePool(): Promise<any[]> {
    // Implementar busca de imagens da pasta storage/images/family
    return [];
  }

  private getDefaultImages(): string[] {
    return [
      '/storage/images/family/default-1.jpg',
      '/storage/images/family/default-2.jpg',
      '/storage/images/family/default-3.jpg',
      '/storage/images/family/default-4.jpg'
    ];
  }

  private parseAIAnalysis(aiAnalysis: string): any {
    // Implementar parser da análise de IA
    return {
      familyOverview: 'Análise do perfil familiar...',
      dreamMapping: 'Mapeamento dos objetivos...',
      transformationScenarios: 'Três cenários possíveis...',
      timeline: 'Cronograma detalhado...',
      practicalTools: 'Recursos e próximos passos...'
    };
  }

  private generateCoverContent(formData: CriadorSonhosFormData): string {
    return `
      Relatório Personalizado de Imigração
      
      Família: ${formData.nome || 'Sua Família'}
      Data: ${new Date().toLocaleDateString('pt-BR')}
      
      Este relatório foi gerado especialmente para sua família,
      baseado em suas respostas e objetivos únicos.
      
      Prepare-se para transformar seus sonhos em realidade!
    `;
  }
}

export const pdfGenerationService = new PDFGenerationService();
export type { PDFGenerationOptions, PDFAccessControl };
