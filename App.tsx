
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { fetchAllSpreadsheetData, extractUniqueOptions } from './services/dataService';
import { TransmissionData, FiltersState, DashboardStats } from './types';
import StatsCards from './components/StatsCards';
import ChartsSection from './components/ChartsSection';
import DataTable from './components/DataTable';

/**
 * Componente de MultiSelect customizado para manter a estética do SAT
 */
const MultiSelect: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  required?: boolean;
}> = ({ label, options, selected, onChange, placeholder, required }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(item => item !== option)
      : [...selected, option];
    onChange(newSelected);
  };

  const selectAll = () => onChange([...options]);
  const clearAll = () => onChange([]);

  return (
    <div className="space-y-1.5 relative" ref={containerRef}>
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        {label}
      </label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-50 border ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'} rounded-xl py-2.5 px-4 transition-all text-xs font-bold text-slate-700 cursor-pointer flex justify-between items-center min-h-[42px]`}
      >
        <span className="truncate">
          {selected.length === 0 
            ? placeholder 
            : selected.length === options.length 
              ? 'Todos selecionados' 
              : `${selected.length} selecionado(s)`}
        </span>
        <i className={`fa-solid fa-chevron-${isOpen ? 'up' : 'down'} text-[10px] text-slate-400`}></i>
      </div>

      {isOpen && (
        <div className="absolute z-[60] mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between border-b border-slate-100 pb-2 mb-2 px-2">
            <button onClick={selectAll} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Selecionar Tudo</button>
            <button onClick={clearAll} className="text-[9px] font-black text-rose-600 uppercase tracking-widest hover:underline">Limpar</button>
          </div>
          <div className="space-y-1">
            {options.map(option => (
              <div 
                key={option} 
                onClick={() => toggleOption(option)}
                className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors group"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selected.includes(option) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>
                  {selected.includes(option) && <i className="fa-solid fa-check text-[10px] text-white"></i>}
                </div>
                <span className="text-xs font-bold text-slate-600 truncate">{option}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  const [allData, setAllData] = useState<TransmissionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [options, setOptions] = useState<any>({
    meses: [], anos: [], bases: [], cidades: [], razoes: [], tipos: []
  });

  const [tempFilters, setTempFilters] = useState<FiltersState>({
    mes: [], ano: [], base: [], cidade: [], razao: [], tipo: [],
  });

  const [appliedFilters, setAppliedFilters] = useState<FiltersState>({
    mes: [], ano: [], base: [], cidade: [], razao: [], tipo: [],
  });

  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await fetchAllSpreadsheetData();
        setAllData(data);
        const extracted = extractUniqueOptions(data);
        setOptions(extracted);
        setLoading(false);
      } catch (err) {
        setError('Erro ao conectar com a base de dados do Google Planilhas.');
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleFilterChange = (field: keyof FiltersState, values: string[]) => {
    setTempFilters(prev => ({ ...prev, [field]: values }));
  };

  const isFormValid = useMemo(() => {
    return tempFilters.mes.length > 0 && tempFilters.ano.length > 0;
  }, [tempFilters.mes, tempFilters.ano]);

  const handleGenerate = () => {
    if (!isFormValid) return;
    setAppliedFilters({ ...tempFilters });
    setHasGenerated(true);
  };

  /**
   * REGRAS GERAIS: Atualização dinâmica ao alterar qualquer filtro.
   * Implementação: Após o primeiro clique em "Gerar", qualquer alteração nos filtros
   * reflete imediatamente nos dados aplicados, desde que os campos obrigatórios sejam mantidos.
   */
  useEffect(() => {
    if (hasGenerated && isFormValid) {
      setAppliedFilters({ ...tempFilters });
    }
  }, [tempFilters, hasGenerated, isFormValid]);

  const filteredData = useMemo(() => {
    if (!hasGenerated) return [];

    return allData.filter(item => {
      const matchMes = appliedFilters.mes.length === 0 || appliedFilters.mes.includes(item.mes);
      const matchAno = appliedFilters.ano.length === 0 || appliedFilters.ano.includes(item.ano);
      const matchBase = appliedFilters.base.length === 0 || appliedFilters.base.includes(item.base);
      const matchRazao = appliedFilters.razao.length === 0 || appliedFilters.razao.includes(item.razao);
      const matchTipo = appliedFilters.tipo.length === 0 || appliedFilters.tipo.includes(item.tipo);

      return matchMes && matchAno && matchBase && matchRazao && matchTipo;
    });
  }, [allData, appliedFilters, hasGenerated]);

  const stats = useMemo<DashboardStats>(() => {
    const aRealizarSum = filteredData.reduce((acc, curr) => acc + curr.aRealizar, 0);
    const realizadasSum = filteredData.reduce((acc, curr) => acc + curr.realizadas, 0);
    const pendentesSum = filteredData.reduce((acc, curr) => acc + curr.pendentes, 0);
    
    const perc = aRealizarSum > 0 ? (pendentesSum / aRealizarSum) * 100 : 0;

    return {
      totalARealizar: aRealizarSum,
      totalRealizadas: realizadasSum,
      totalPendentes: pendentesSum,
      percentualPendentes: perc
    };
  }, [filteredData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando base de dados...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-rose-100 text-center">
          <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Erro de Sincronização</h2>
          <p className="text-slate-400 text-sm mb-6 font-medium">{error}</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-slate-50 font-sans text-slate-900">
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/50">
              <i className="fa-solid fa-tower-broadcast text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-xl font-black text-white leading-none tracking-tight">SAT</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">SISTEMA DE ACOMPANHAMENTO DE TRANSMISSÃO</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-slate-400">
              <i className="fa-solid fa-filter text-blue-600"></i>
              <h2 className="font-black uppercase text-[11px] tracking-widest">Painel de Filtros</h2>
            </div>
            <div className="flex flex-col items-end">
              <button 
                onClick={handleGenerate}
                disabled={!isFormValid}
                className={`px-8 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 ${
                  isFormValid 
                    ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <i className="fa-solid fa-play"></i> Gerar
              </button>
              {!isFormValid && (
                <span className="text-[8px] font-black text-rose-500 uppercase tracking-tighter mt-1">Selecione Mês e Ano</span>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MultiSelect 
              label="Selecione o Mês (seleção obrigatória)"
              options={options.meses}
              selected={tempFilters.mes}
              onChange={(v) => handleFilterChange('mes', v)}
              placeholder="Selecione meses..."
              required
            />

            <MultiSelect 
              label="Selecione o Ano (seleção obrigatória)"
              options={options.anos}
              selected={tempFilters.ano}
              onChange={(v) => handleFilterChange('ano', v)}
              placeholder="Selecione anos..."
              required
            />

            <MultiSelect 
              label="Selecione a Base Operativa"
              options={options.bases}
              selected={tempFilters.base}
              onChange={(v) => handleFilterChange('base', v)}
              placeholder="Todas as Bases..."
            />

            <MultiSelect 
              label="Selecione o Razão"
              options={options.razoes}
              selected={tempFilters.razao}
              onChange={(v) => handleFilterChange('razao', v)}
              placeholder="Todos os Razões..."
            />

            <MultiSelect 
              label="Selecione o Tipo"
              options={options.tipos}
              selected={tempFilters.tipo}
              onChange={(v) => handleFilterChange('tipo', v)}
              placeholder="Todos os Tipos..."
            />
          </div>
        </section>

        {!hasGenerated ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-24 text-center">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
              <i className="fa-solid fa-play text-4xl text-blue-200"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight uppercase">Dashboard Pronto</h3>
            <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium leading-relaxed">
              Selecione o <strong>Mês</strong> e o <strong>Ano</strong> (obrigatórios) e clique em <strong>GERAR</strong> para visualizar os dados.
            </p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-24 text-center">
             <div className="bg-rose-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-inner">
              <i className="fa-solid fa-magnifying-glass text-4xl text-rose-200"></i>
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-4 tracking-tight uppercase">Sem Resultados</h3>
            <p className="text-slate-400 max-w-sm mx-auto text-sm font-medium leading-relaxed">
              Nenhum dado encontrado para a combinação de filtros selecionada.
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <StatsCards stats={stats} />
            <ChartsSection data={filteredData} />
            <DataTable data={filteredData} />
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pb-12 text-center">
        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em]">
          SAT – SISTEMA DE ACOMPANHAMENTO DE TRANSMISSÃO | 2024
        </p>
      </footer>
    </div>
  );
};

export default App;
