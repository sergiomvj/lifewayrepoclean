import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { CriadorSonhosFormData } from '@/types/forms';
import { UserProfile } from '@/types/userContext';

// Registrar fontes customizadas
Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2' },
    { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyfAZhrib2Bg-4.woff2', fontWeight: 'bold' }
  ]
});

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Inter'
  },
  
  // Header e Footer
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6'
  },
  
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 10
  },
  
  // Capa
  coverPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center'
  },
  
  coverTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10
  },
  
  coverSubtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 30
  },
  
  coverImage: {
    width: 300,
    height: 200,
    objectFit: 'cover',
    borderRadius: 10,
    marginBottom: 20
  },
  
  coverInfo: {
    backgroundColor: '#F3F4F6',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400
  },
  
  // Seções
  section: {
    marginBottom: 25,
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 8
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 5
  },
  
  sectionContent: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#374151'
  },
  
  // Cenários
  scenarioContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6'
  },
  
  scenarioTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E40AF',
    marginBottom: 10
  },
  
  scenarioContent: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#1F2937'
  },
  
  // Timeline
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-start'
  },
  
  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    marginRight: 15,
    marginTop: 4
  },
  
  timelineContent: {
    flex: 1
  },
  
  timelineTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5
  },
  
  timelineDescription: {
    fontSize: 11,
    color: '#6B7280',
    lineHeight: 1.4
  },
  
  // Utilitários
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  
  column: {
    flexDirection: 'column'
  },
  
  textCenter: {
    textAlign: 'center'
  },
  
  textBold: {
    fontWeight: 'bold'
  },
  
  textMuted: {
    color: '#6B7280'
  },
  
  spacer: {
    height: 20
  },
  
  // Premium features
  premiumBadge: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    padding: '5 10',
    borderRadius: 15,
    fontSize: 10,
    fontWeight: 'bold'
  },
  
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    color: '#F3F4F6',
    opacity: 0.3,
    zIndex: -1
  }
});

interface PDFTemplateProps {
  formData: CriadorSonhosFormData;
  aiAnalysis: string;
  userProfile: UserProfile;
  selectedImages: string[];
  template: 'standard' | 'premium';
  watermark?: boolean;
}

const PDFTemplate: React.FC<PDFTemplateProps> = ({
  formData,
  aiAnalysis,
  userProfile,
  selectedImages,
  template,
  watermark = false
}) => {
  // Processar análise da IA em seções
  const processAIAnalysis = (analysis: string) => {
    const sections = {
      visaoInspiradora: '',
      mapeamentoSonhos: '',
      cenarios: [] as string[],
      timeline: [] as string[],
      ferramentas: '',
      proximosPassos: ''
    };

    // Extrair seções da análise (implementar parsing baseado no prompt)
    const lines = analysis.split('\n');
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.includes('VISÃO INSPIRADORA')) {
        currentSection = 'visaoInspiradora';
      } else if (line.includes('MAPEAMENTO DE SONHOS')) {
        currentSection = 'mapeamentoSonhos';
      } else if (line.includes('CENÁRIO')) {
        currentSection = 'cenarios';
      } else if (line.includes('TIMELINE') || line.includes('CRONOGRAMA')) {
        currentSection = 'timeline';
      } else if (line.includes('FERRAMENTAS')) {
        currentSection = 'ferramentas';
      } else if (line.includes('PRÓXIMOS PASSOS')) {
        currentSection = 'proximosPassos';
      } else if (line.trim() && currentSection) {
        if (currentSection === 'cenarios' || currentSection === 'timeline') {
          sections[currentSection].push(line.trim());
        } else {
          sections[currentSection] += line + '\n';
        }
      }
    });

    return sections;
  };

  const analysisData = processAIAnalysis(aiAnalysis);
  const familyName = formData.nome_familia || userProfile.name || 'Família';
  const mainImage = selectedImages[0] || '/images/family/default-family.jpg';

  return (
    <Document>
      {/* Página de Capa */}
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>DEMO</Text>}
        
        <View style={styles.coverPage}>
          <Text style={styles.coverTitle}>
            Jornada dos Sonhos
          </Text>
          <Text style={styles.coverSubtitle}>
            Plano Personalizado de Imigração para os EUA
          </Text>
          
          {mainImage && (
            <Image
              style={styles.coverImage}
              src={mainImage}
            />
          )}
          
          <View style={styles.coverInfo}>
            <View style={styles.row}>
              <Text style={styles.textBold}>Família:</Text>
              <Text>{familyName}</Text>
            </View>
            <View style={[styles.row, { marginTop: 10 }]}>
              <Text style={styles.textBold}>Data:</Text>
              <Text>{new Date().toLocaleDateString('pt-BR')}</Text>
            </View>
            <View style={[styles.row, { marginTop: 10 }]}>
              <Text style={styles.textBold}>Versão:</Text>
              <View style={template === 'premium' ? styles.premiumBadge : {}}>
                <Text>{template === 'premium' ? 'PREMIUM' : 'PADRÃO'}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <Text style={styles.footer}>
          Gerado por LifeWay USA Journey • www.lifewayusa.com
        </Text>
      </Page>

      {/* Visão Inspiradora */}
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>DEMO</Text>}
        
        <View style={styles.header}>
          <Text style={styles.textBold}>Visão Inspiradora</Text>
          <Text style={styles.textMuted}>Página 2</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🌟 Sua Visão de Vida nos EUA
          </Text>
          <Text style={styles.sectionContent}>
            {analysisData.visaoInspiradora || 'Sua jornada única rumo ao sonho americano começa aqui. Baseado no seu perfil e aspirações, desenvolvemos uma visão inspiradora do que sua vida pode se tornar nos Estados Unidos.'}
          </Text>
        </View>

        {selectedImages.slice(1, 3).map((image, index) => (
          <View key={index} style={{ marginBottom: 15, textAlign: 'center' }}>
            <Image
              style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8 }}
              src={image}
            />
          </View>
        ))}
        
        <Text style={styles.footer}>
          Gerado por LifeWay USA Journey • www.lifewayusa.com
        </Text>
      </Page>

      {/* Mapeamento de Sonhos */}
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>DEMO</Text>}
        
        <View style={styles.header}>
          <Text style={styles.textBold}>Mapeamento de Sonhos</Text>
          <Text style={styles.textMuted}>Página 3</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🗺️ Seus Objetivos e Aspirações
          </Text>
          <Text style={styles.sectionContent}>
            {analysisData.mapeamentoSonhos || 'Identificamos seus principais objetivos e como eles se alinham com as oportunidades disponíveis nos Estados Unidos.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📋 Informações do Perfil
          </Text>
          <View style={styles.sectionContent}>
            <View style={[styles.row, { marginBottom: 8 }]}>
              <Text style={styles.textBold}>Situação Atual:</Text>
              <Text>{formData.situacao_atual || 'Não informado'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 8 }]}>
              <Text style={styles.textBold}>Objetivo Principal:</Text>
              <Text>{formData.objetivo_principal || 'Não informado'}</Text>
            </View>
            <View style={[styles.row, { marginBottom: 8 }]}>
              <Text style={styles.textBold}>Prazo Desejado:</Text>
              <Text>{formData.prazo_desejado || 'Não informado'}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.footer}>
          Gerado por LifeWay USA Journey • www.lifewayusa.com
        </Text>
      </Page>

      {/* Cenários de Transformação */}
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>DEMO</Text>}
        
        <View style={styles.header}>
          <Text style={styles.textBold}>Cenários de Transformação</Text>
          <Text style={styles.textMuted}>Página 4</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🚀 Caminhos Possíveis
          </Text>
          
          {analysisData.cenarios.length > 0 ? (
            analysisData.cenarios.slice(0, 3).map((cenario, index) => (
              <View key={index} style={styles.scenarioContainer}>
                <Text style={styles.scenarioTitle}>
                  Cenário {index + 1}
                </Text>
                <Text style={styles.scenarioContent}>
                  {cenario}
                </Text>
              </View>
            ))
          ) : (
            <>
              <View style={styles.scenarioContainer}>
                <Text style={styles.scenarioTitle}>
                  Cenário Conservador
                </Text>
                <Text style={styles.scenarioContent}>
                  Abordagem gradual e segura, focando na preparação sólida e minimização de riscos.
                </Text>
              </View>
              
              <View style={styles.scenarioContainer}>
                <Text style={styles.scenarioTitle}>
                  Cenário Equilibrado
                </Text>
                <Text style={styles.scenarioContent}>
                  Combinação de preparação cuidadosa com ações mais assertivas em momentos estratégicos.
                </Text>
              </View>
              
              <View style={styles.scenarioContainer}>
                <Text style={styles.scenarioTitle}>
                  Cenário Acelerado
                </Text>
                <Text style={styles.scenarioContent}>
                  Abordagem mais agressiva para quem tem urgência e recursos para acelerar o processo.
                </Text>
              </View>
            </>
          )}
        </View>
        
        <Text style={styles.footer}>
          Gerado por LifeWay USA Journey • www.lifewayusa.com
        </Text>
      </Page>

      {/* Timeline de Realização */}
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>DEMO</Text>}
        
        <View style={styles.header}>
          <Text style={styles.textBold}>Timeline de Realização</Text>
          <Text style={styles.textMuted}>Página 5</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            📅 Cronograma Estratégico
          </Text>
          
          {analysisData.timeline.length > 0 ? (
            analysisData.timeline.map((item, index) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineMarker} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Etapa {index + 1}
                  </Text>
                  <Text style={styles.timelineDescription}>
                    {item}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <>
              <View style={styles.timelineItem}>
                <View style={styles.timelineMarker} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Preparação Inicial (0-3 meses)
                  </Text>
                  <Text style={styles.timelineDescription}>
                    Organização de documentos, melhoria do inglês e pesquisa aprofundada sobre oportunidades.
                  </Text>
                </View>
              </View>
              
              <View style={styles.timelineItem}>
                <View style={styles.timelineMarker} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Desenvolvimento (3-12 meses)
                  </Text>
                  <Text style={styles.timelineDescription}>
                    Qualificação profissional, networking e primeiras aplicações estratégicas.
                  </Text>
                </View>
              </View>
              
              <View style={styles.timelineItem}>
                <View style={styles.timelineMarker} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    Execução (12-24 meses)
                  </Text>
                  <Text style={styles.timelineDescription}>
                    Processos de visto, mudança e estabelecimento inicial nos Estados Unidos.
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
        
        <Text style={styles.footer}>
          Gerado por LifeWay USA Journey • www.lifewayusa.com
        </Text>
      </Page>

      {/* Ferramentas Práticas */}
      <Page size="A4" style={styles.page}>
        {watermark && <Text style={styles.watermark}>DEMO</Text>}
        
        <View style={styles.header}>
          <Text style={styles.textBold}>Ferramentas Práticas</Text>
          <Text style={styles.textMuted}>Página 6</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🛠️ Recursos e Ferramentas
          </Text>
          <Text style={styles.sectionContent}>
            {analysisData.ferramentas || 'Conjunto de ferramentas e recursos práticos para apoiar sua jornada de imigração.'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            🔗 Recursos LifeWay
          </Text>
          <View style={styles.sectionContent}>
            <Text>• VisaMatch: Análise personalizada de estratégias de visto</Text>
            <Text>• Chat com Especialistas: Suporte direto com profissionais</Text>
            <Text>• Comunidade LifeWay: Networking com outros imigrantes</Text>
            <Text>• Recursos Educacionais: Guias e materiais de apoio</Text>
            {template === 'premium' && (
              <>
                <Text>• Consultoria Premium: Sessões individuais</Text>
                <Text>• Acompanhamento Personalizado: Suporte contínuo</Text>
                <Text>• Acesso Prioritário: Atendimento preferencial</Text>
              </>
            )}
          </View>
        </View>
        
        <Text style={styles.footer}>
          Gerado por LifeWay USA Journey • www.lifewayusa.com
        </Text>
      </Page>

      {/* Próximos Passos (apenas Premium) */}
      {template === 'premium' && (
        <Page size="A4" style={styles.page}>
          <View style={styles.header}>
            <Text style={styles.textBold}>Próximos Passos</Text>
            <Text style={styles.textMuted}>Página 7</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              ✅ Plano de Ação Imediato
            </Text>
            <Text style={styles.sectionContent}>
              {analysisData.proximosPassos || 'Passos específicos e acionáveis para começar sua jornada imediatamente.'}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              📞 Suporte Especializado
            </Text>
            <View style={styles.sectionContent}>
              <Text>Como usuário Premium, você tem acesso a:</Text>
              <Text>• Consultoria individual com especialistas</Text>
              <Text>• Revisão personalizada do seu plano</Text>
              <Text>• Suporte prioritário em todas as ferramentas</Text>
              <Text>• Atualizações regulares do seu relatório</Text>
            </View>
          </View>
          
          <Text style={styles.footer}>
            Gerado por LifeWay USA Journey • www.lifewayusa.com
          </Text>
        </Page>
      )}
    </Document>
  );
};

export default PDFTemplate;
