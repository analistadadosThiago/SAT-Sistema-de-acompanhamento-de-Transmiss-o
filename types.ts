
export interface TransmissionData {
  mes: string;
  ano: string;
  base: string;
  cidade: string;
  razao: string;
  tipo: string;
  matricula: string;
  leiturista: string;
  aRealizar: number;
  realizadas: number;
  pendentes: number;
  leituras100: number;
  leituras30: number;
  ul: string;
  id?: string;
}

export interface FiltersState {
  mes: string[];
  ano: string[];
  base: string[];
  cidade: string[];
  razao: string[];
  tipo: string[];
  leiturista: string[];
}

export interface DashboardStats {
  totalARealizar: number;
  totalRealizadas: number;
  totalPendentes: number;
  percentualPendentes: number;
}
