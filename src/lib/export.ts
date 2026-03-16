import * as XLSX from 'xlsx';
import { SocialRecord } from '../types';

/**
 * Export a single social record to PDF (social record card)
 * This generates a formatted PDF document for printing
 */
export async function exportRecordToPDF(record: SocialRecord): Promise<Blob | null> {
  try {
    // For PDF generation, we'll use jsPDF
    // Since we need to install the package, we'll create a simple HTML-based approach first
    // that can be printed to PDF
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return null;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Ficha Social - ${record.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #1e40af;
    }
    .header p {
      margin: 5px 0 0;
      color: #6b7280;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      background: #f3f4f6;
      padding: 10px 15px;
      font-weight: bold;
      color: #1f2937;
      border-left: 4px solid #2563eb;
      margin-bottom: 15px;
    }
    .field {
      display: flex;
      margin-bottom: 10px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .field-label {
      font-weight: bold;
      min-width: 200px;
      color: #4b5563;
    }
    .field-value {
      flex: 1;
      color: #1f2937;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    .badge-critica { background: #fecaca; color: #991b1b; }
    .badge-moderada { background: #fed7aa; color: #9a3412; }
    .badge-estavel { background: #bbf7d0; color: #166534; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
    }
    .images {
      display: flex;
      gap: 15px;
      margin-top: 10px;
    }
    .images img {
      max-width: 200px;
      max-height: 200px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Ficha de Registro Social</h1>
    <p>Sistema de Gestão de Impacto Social</p>
  </div>

  <div class="section">
    <div class="section-title">Informações Pessoais</div>
    <div class="field">
      <span class="field-label">Nome Completo:</span>
      <span class="field-value">${record.name}</span>
    </div>
    <div class="field">
      <span class="field-label">Data de Nascimento:</span>
      <span class="field-value">${new Date(record.birth_date).toLocaleDateString('pt-BR')}</span>
    </div>
    <div class="field">
      <span class="field-label">Idade:</span>
      <span class="field-value">${record.age} anos</span>
    </div>
    <div class="field">
      <span class="field-label">Gênero:</span>
      <span class="field-value">${record.gender || 'Não informado'}</span>
    </div>
    <div class="field">
      <span class="field-label">Telefone:</span>
      <span class="field-value">${record.phone || 'Não informado'}</span>
    </div>
    <div class="field">
      <span class="field-label">Email:</span>
      <span class="field-value">${record.email || 'Não informado'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Localização</div>
    <div class="field">
      <span class="field-label">Bairro:</span>
      <span class="field-value">${record.neighborhood}</span>
    </div>
    <div class="field">
      <span class="field-label">Localidade:</span>
      <span class="field-value">${record.locality}</span>
    </div>
    <div class="field">
      <span class="field-label">Endereço:</span>
      <span class="field-value">${record.address || 'Não informado'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Contexto Familiar e Social</div>
    <div class="field">
      <span class="field-label">Tamanho da Família:</span>
      <span class="field-value">${record.family_size || 'Não informado'}</span>
    </div>
    <div class="field">
      <span class="field-label">Dependentes:</span>
      <span class="field-value">${record.dependents || 'Não informado'}</span>
    </div>
    <div class="field">
      <span class="field-label">Escolaridade:</span>
      <span class="field-value">${record.education_level || 'Não informado'}</span>
    </div>
    <div class="field">
      <span class="field-label">Renda Mensal:</span>
      <span class="field-value">${record.monthly_income ? `MT ${record.monthly_income.toLocaleString('pt-BR')}` : 'Não informado'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Saúde e Deficiência</div>
    <div class="field">
      <span class="field-label">Possui Deficiência:</span>
      <span class="field-value">${record.has_disability ? 'Sim' : 'Não'}</span>
    </div>
    ${record.has_disability ? `
    <div class="field">
      <span class="field-label">Tipo de Deficiência:</span>
      <span class="field-value">${record.disability_type || 'Não especificado'}</span>
    </div>
    ` : ''}
    <div class="field">
      <span class="field-label">Condição de Saúde:</span>
      <span class="field-value">${record.health_condition || 'Não informado'}</span>
    </div>
    <div class="field">
      <span class="field-label">Situação Atual:</span>
      <span class="field-value">
        <span class="badge badge-${record.situation.toLowerCase()}">${record.situation}</span>
      </span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">História Social</div>
    <div class="field">
      <span class="field-label" style="flex-direction: column;">
        <span style="font-weight: bold; margin-bottom: 5px;">Histórico:</span>
        <span>${record.social_history || 'Não informado'}</span>
      </span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Emprego e Ações</div>
    <div class="field">
      <span class="field-label">Situação de Emprego:</span>
      <span class="field-value">${record.employment_status}</span>
    </div>
    <div class="field">
      <span class="field-label">Ajuda Necessária:</span>
      <span class="field-value">${record.help_needed}</span>
    </div>
    <div class="field">
      <span class="field-label">Encaminhamento:</span>
      <span class="field-value">${record.referral}</span>
    </div>
  </div>

  ${record.image_urls && record.image_urls.length > 0 ? `
  <div class="section">
    <div class="section-title">Imagens de Apoio</div>
    <div class="images">
      ${record.image_urls.map(url => `<img src="${url}" alt="Imagem de apoio">`).join('')}
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>Registro criado em: ${new Date(record.created_at).toLocaleString('pt-BR')}</p>
    <p>Última atualização: ${new Date(record.updated_at).toLocaleString('pt-BR')}</p>
    <p>ID do Registro: ${record.id}</p>
  </div>
</body>
</html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    
    // Wait for the document to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };

    return null; // The print dialog will handle the PDF generation
  } catch (error) {
    console.error('Error generating PDF:', error);
    return null;
  }
}

/**
 * Export multiple records to Excel (XLSX)
 */
export function exportRecordsToExcel(
  records: SocialRecord[],
  filename: string = 'registros_sociais.xlsx'
): void {
  try {
    // Transform records into a flat structure for Excel
    const excelData = records.map(record => ({
      'ID': record.id,
      'Nome': record.name,
      'Data de Nascimento': new Date(record.birth_date).toLocaleDateString('pt-BR'),
      'Idade': record.age,
      'Gênero': record.gender || '',
      'Telefone': record.phone || '',
      'Email': record.email || '',
      'Bairro': record.neighborhood,
      'Localidade': record.locality,
      'Endereço': record.address || '',
      'Tamanho da Família': record.family_size || '',
      'Dependentes': record.dependents || '',
      'Escolaridade': record.education_level || '',
      'Renda Mensal': record.monthly_income || '',
      'Possui Deficiência': record.has_disability ? 'Sim' : 'Não',
      'Tipo de Deficiência': record.disability_type || '',
      'Condição de Saúde': record.health_condition || '',
      'Situação': record.situation,
      'História Social': record.social_history || '',
      'Situação de Emprego': record.employment_status,
      'Ajuda Necessária': record.help_needed,
      'Encaminhamento': record.referral,
      'ID do Agente': record.agent_id,
      'ID do Posto': record.station_id,
      'Data de Criação': new Date(record.created_at).toLocaleString('pt-BR'),
      'Última Atualização': new Date(record.updated_at).toLocaleString('pt-BR'),
    }));

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    const colWidths = [
      { wch: 40 }, // ID
      { wch: 35 }, // Nome
      { wch: 15 }, // Data de Nascimento
      { wch: 8 },  // Idade
      { wch: 12 }, // Gênero
      { wch: 18 }, // Telefone
      { wch: 30 }, // Email
      { wch: 25 }, // Bairro
      { wch: 25 }, // Localidade
      { wch: 40 }, // Endereço
      { wch: 18 }, // Tamanho da Família
      { wch: 12 }, // Dependentes
      { wch: 20 }, // Escolaridade
      { wch: 15 }, // Renda Mensal
      { wch: 18 }, // Possui Deficiência
      { wch: 20 }, // Tipo de Deficiência
      { wch: 30 }, // Condição de Saúde
      { wch: 12 }, // Situação
      { wch: 50 }, // História Social
      { wch: 20 }, // Situação de Emprego
      { wch: 40 }, // Ajuda Necessária
      { wch: 40 }, // Encaminhamento
      { wch: 40 }, // ID do Agente
      { wch: 40 }, // ID do Posto
      { wch: 22 }, // Data de Criação
      { wch: 22 }, // Última Atualização
    ];
    worksheet['!cols'] = colWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registros Sociais');

    // Generate and download
    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

/**
 * Export monthly summary to Excel
 */
export function exportMonthlySummaryToExcel(
  summary: any,
  filename: string
): void {
  try {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Resumo Mensal'],
      ['Mês', summary.month],
      ['Ano', summary.year],
      ['Total de Registros', summary.total_records],
      [],
      ['Por Situação'],
      ...Object.entries(summary.by_situation).map(([key, value]) => [key, value]),
      [],
      ['Por Deficiência'],
      ...Object.entries(summary.by_disability).map(([key, value]) => [key, value]),
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // By station sheet
    const stationData = Object.entries(summary.by_station).map(([name, count]) => ({
      'Posto Administrativo': name,
      'Total de Registros': count,
    }));
    const stationSheet = XLSX.utils.json_to_sheet(stationData);
    XLSX.utils.book_append_sheet(workbook, stationSheet, 'Por Posto');

    // By location sheet
    const locationData = summary.by_location.map((loc: any) => ({
      'Bairro': loc.neighborhood,
      'Localidade': loc.locality,
      'Total': loc.count,
      'Crítica': loc.critical,
      'Moderada': loc.moderate,
      'Estável': loc.stable,
    }));
    const locationSheet = XLSX.utils.json_to_sheet(locationData);
    XLSX.utils.book_append_sheet(workbook, locationSheet, 'Por Localização');

    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting monthly summary:', error);
    throw error;
  }
}

/**
 * Export quarterly impact to Excel
 */
export function exportQuarterlyImpactToExcel(
  impact: any,
  filename: string
): void {
  try {
    const workbook = XLSX.utils.book_new();

    // Impact summary sheet
    const summaryData = [
      ['Relatório Trimestral de Impacto'],
      ['Trimestre', `Q${impact.quarter}`],
      ['Ano', impact.year],
      ['Total de Registros', impact.total_records],
      ['Média Diária', impact.avg_daily],
      ['Tendência', impact.trend],
      ['Mudança na Vulnerabilidade', `${impact.vulnerability_change}%`],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // Top neighborhoods sheet
    const neighborhoodData = impact.top_neighborhoods.map((loc: any) => ({
      'Bairro': loc.neighborhood,
      'Localidade': loc.locality,
      'Total': loc.count,
      'Crítica': loc.critical,
      'Moderada': loc.moderate,
      'Estável': loc.stable,
    }));
    const neighborhoodSheet = XLSX.utils.json_to_sheet(neighborhoodData);
    XLSX.utils.book_append_sheet(workbook, neighborhoodSheet, 'Top Bairros');

    XLSX.writeFile(workbook, filename);
  } catch (error) {
    console.error('Error exporting quarterly impact:', error);
    throw error;
  }
}

/**
 * Export filtered records to Excel
 */
export function exportFilteredRecords(
  records: SocialRecord[],
  filters: {
    startDate?: string;
    endDate?: string;
    station?: string;
    situation?: string;
  }
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const filterParts = [];
  
  if (filters.startDate) filterParts.push(`de_${filters.startDate}`);
  if (filters.endDate) filterParts.push(`ate_${filters.endDate}`);
  if (filters.station) filterParts.push(`posto_${filters.station}`);
  if (filters.situation) filterParts.push(`situacao_${filters.situation}`);
  
  const filename = filterParts.length > 0
    ? `registros_${dateStr}_${filterParts.join('_')}.xlsx`
    : `registros_${dateStr}.xlsx`;

  exportRecordsToExcel(records, filename);
}
