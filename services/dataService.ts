
import { TransmissionData } from '../types';

// URL de exportação direta CSV do Google Sheets
const DOC_ID = '1ITc7kutbxNFlFYaiGotQVjWYJp4B-12728nhur_PyTg';
const CSV_URL = `https://docs.google.com/spreadsheets/d/${DOC_ID}/export?format=csv`;

const cleanValue = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

/**
 * Função para conversão numérica rigorosa.
 * Garante que strings formatadas (ex: "1.234,50" ou "1 234") 
 * sejam convertidas corretamente em números para cálculos de soma.
 */
const parseNumericValue = (val: string): number => {
  if (!val || val === '' || val === '-') return 0;
  // Remove pontos de milhares, espaços e substitui vírgula por ponto decimal
  const cleaned = val.toString().replace(/\s/g, '').replace(/\./g, '').replace(/,/g, '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num); // Leituras são tratadas como números inteiros
};

export async function fetchAllSpreadsheetData(): Promise<TransmissionData[]> {
  try {
    const response = await fetch(CSV_URL);
    if (!response.ok) throw new Error('Falha ao acessar os dados da planilha.');
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    if (lines.length <= 1) return [];

    return lines.slice(1).map((line, idx) => {
      // Regex para CSV que respeita aspas
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cleanValue);
      
      /**
       * MAPEAMENTO RIGOROSO DE COLUNAS (Letras -> Índices):
       * D (3): BASE
       * F (5): UL
       * G (6): RAZÃO
       * J (9): TIPO
       * K (10): LEITURAS A REALIZAR
       * O (14): LEITURAS (REALIZADAS)
       * Q (16): LEITURAS Ñ REALIZADAS (PENDENTES)
       */
      return {
        mes: values[0] || '',
        ano: values[1] || '',
        cidade: values[2] || '',
        base: values[3] || '',
        ul: values[5] || '',
        razao: values[6] || '',
        tipo: values[9] || '',
        aRealizar: parseNumericValue(values[10]), // Coluna K
        realizadas: parseNumericValue(values[14]), // Coluna O
        pendentes: parseNumericValue(values[16]),  // Coluna Q
        id: `row-${idx}`
      };
    });
  } catch (error) {
    console.error('Erro na extração de dados:', error);
    throw error;
  }
}

export function extractUniqueOptions(data: TransmissionData[]) {
  const getUnique = (key: keyof TransmissionData) => 
    Array.from(new Set(data.map(item => String(item[key]))))
      .filter(v => v !== '' && v !== 'undefined')
      .sort();

  return {
    meses: getUnique('mes'),
    anos: getUnique('ano'),
    bases: getUnique('base'),
    cidades: getUnique('cidade'),
    razoes: getUnique('razao'),
    tipos: getUnique('tipo'),
  };
}
