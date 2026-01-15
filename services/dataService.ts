
import { TransmissionData } from '../types';

/**
 * CONFIGURAÇÃO DA BASE DE DADOS OFICIAL
 * ID: 1ITc7kutbxNFlFYaiGotQVjWYJp4B-12728nhur_PyTg
 * ABA: Nome_Matricula (Alterado conforme solicitação)
 */
const DOC_ID = '1ITc7kutbxNFlFYaiGotQVjWYJp4B-12728nhur_PyTg';
const SHEET_NAME = 'Nome_Matricula';

/**
 * URL de exportação direta da aba específica.
 */
const CSV_URL = `https://docs.google.com/spreadsheets/d/${DOC_ID}/export?format=csv&sheet=${encodeURIComponent(SHEET_NAME)}`;

const cleanValue = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

/**
 * Função para conversão numérica rigorosa.
 */
const parseNumericValue = (val: string): number => {
  if (!val || val === '' || val === '-') return 0;
  const cleaned = val.toString().replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num);
};

export async function fetchAllSpreadsheetData(): Promise<TransmissionData[]> {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error('Falha ao acessar a aba Nome_Matricula da planilha oficial.');
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

    return lines.slice(1).map((line, idx) => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cleanValue);
      
      /**
       * MAPEAMENTO RIGOROSO DA ABA "Nome_Matricula":
       * A (0): Mês
       * B (1): Ano
       * C (2): Cidade
       * D (3): BASE
       * F (5): UL
       * G (6): RAZÃO
       * J (9): TIPO
       * K (10): LEITURAS A REALIZAR
       * L (11): LEITURAS 100%
       * M (12): LEITURAS 30%
       * O (14): LEITURAS (REALIZADAS)
       * Q (16): LEITURAS Ñ REALIZADAS (PENDENTES)
       * R (17): MATRÍCULA
       * S (18): LEITURISTA (Nome_Matricula conforme solicitação)
       */
      return {
        mes: values[0] || '',
        ano: values[1] || '',
        cidade: values[2] || '',
        base: values[3] || '',
        ul: values[5] || '',
        razao: values[6] || '',
        tipo: values[9] || '',
        matricula: values[17] || '', 
        leiturista: values[18] || '',
        aRealizar: parseNumericValue(values[10]),
        leituras100: parseNumericValue(values[11]),
        leituras30: parseNumericValue(values[12]),
        realizadas: parseNumericValue(values[14]),
        pendentes: parseNumericValue(values[16]),
        id: `row-${idx}`
      };
    });
  } catch (error) {
    console.error('Erro crítico na extração da aba Nome_Matricula:', error);
    throw error;
  }
}

export function extractUniqueOptions(data: TransmissionData[]) {
  const getUnique = (key: keyof TransmissionData) => 
    Array.from(new Set(data.map(item => String(item[key]))))
      .filter(v => v !== '' && v !== 'undefined')
      .sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));

  return {
    meses: getUnique('mes'),
    anos: getUnique('ano'),
    bases: getUnique('base'),
    cidades: getUnique('cidade'),
    razoes: getUnique('razao'),
    tipos: getUnique('tipo'),
    leituristas: getUnique('leiturista'), 
  };
}
