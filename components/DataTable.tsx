
import React, { useState, useMemo } from 'react';
import { TransmissionData } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface DataTableProps {
  data: TransmissionData[];
  finalFilteredData: TransmissionData[];
  transStatus: 'Todos' | 'Completo' | 'Incompleto';
  setTransStatus: (status: 'Todos' | 'Completo' | 'Incompleto') => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, finalFilteredData, transStatus, setTransStatus }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Ordenação por BASE (A -> Z)
  const sortedData = useMemo(() => {
    return [...finalFilteredData].sort((a, b) => 
      a.base.localeCompare(b.base, 'pt-BR', { numeric: true, sensitivity: 'base' })
    );
  }, [finalFilteredData]);

  // Resumo consolidado baseado nos dados da tabela (finalFilteredData)
  const summary = useMemo(() => {
    const totalRealizadas = sortedData.reduce((acc, curr) => acc + curr.realizadas, 0);
    const totalPendentes = sortedData.reduce((acc, curr) => acc + curr.pendentes, 0);
    const totalARealizar = sortedData.reduce((acc, curr) => acc + curr.aRealizar, 0);
    const percPendenteTotal = totalARealizar > 0 ? (totalPendentes / totalARealizar) * 100 : 0;

    return { totalRealizadas, totalPendentes, percPendenteTotal };
  }, [sortedData]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const calculateRowPercent = (row: TransmissionData) => {
    if (row.aRealizar === 0) return 0;
    return (row.pendentes / row.aRealizar) * 100;
  };

  const formatPercent = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(sortedData.map(r => ({
      'BASE': r.base,
      'UL': r.ul,
      'LEIT.': r.leiturista,
      'L. A REALIZAR': r.aRealizar,
      'L. REALIZADA': r.realizadas,
      'L. Ñ-REALIZADA': r.pendentes,
      'L. 100%': r.leituras100,
      'L. 30%': r.leituras30,
      '%': formatPercent(calculateRowPercent(r))
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório SAT");
    XLSX.writeFile(wb, "relatorio_sat.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const tableData = sortedData.map(r => [
      r.base, 
      r.ul, 
      r.leiturista,
      r.aRealizar, 
      r.realizadas, 
      r.pendentes, 
      r.leituras100,
      r.leituras30,
      formatPercent(calculateRowPercent(r))
    ]);

    (doc as any).autoTable({
      head: [['BASE', 'UL', 'LEIT.', 'L. A REALIZAR', 'L. REALIZADA', 'L. Ñ-REALIZADA', 'L. 100%', 'L. 30%', '%']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'center' },
        6: { halign: 'center' },
        7: { halign: 'center' },
        8: { halign: 'right' }
      }
    });
    doc.save("relatorio_sat.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 text-slate-500">
          <i className="fa-solid fa-list-check text-blue-600"></i>
          <h2 className="font-black uppercase text-[11px] tracking-widest dark:text-slate-300">Análise de Quantidade de Leituras</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-xl flex flex-col items-center transition-colors">
          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Leituras Realizadas</span>
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{summary.totalRealizadas}</span>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-4 rounded-xl flex flex-col items-center transition-colors">
          <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Total de Leituras Ñ Realizadas</span>
          <span className="text-xl font-black text-amber-700 dark:text-amber-300">{summary.totalPendentes}</span>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-4 rounded-xl flex flex-col items-center transition-colors">
          <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">% Pendente Total</span>
          <span className="text-xl font-black text-rose-700 dark:text-rose-300">{formatPercent(summary.percPendenteTotal)}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Relação por Base/Razão</h3>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Acompanhamento detalhado das transmissões</p>
            </div>
            
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
              <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Selecione o Status de transmissão:</label>
              <select 
                className="bg-transparent text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider focus:outline-none cursor-pointer"
                value={transStatus}
                onChange={(e) => {
                  setTransStatus(e.target.value as any);
                  setCurrentPage(1);
                }}
              >
                <option value="Todos">Exibir Todos</option>
                <option value="Completo">Completo</option>
                <option value="Incompleto">Incompleto</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800 hover:bg-emerald-100 transition-all">
              <i className="fa-solid fa-file-excel"></i> Exportar Excel
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800 hover:bg-rose-100 transition-all">
              <i className="fa-solid fa-file-pdf"></i> Exportar PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                {[
                  'BASE', 
                  'UL', 
                  'Leit.',
                  'L. A REALIZAR', 
                  'L. REALIZADA',
                  'L. Ñ-REALIZADA',
                  'L. 100%',
                  'L. 30%',
                  '%'
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {paginatedData.map((row, i) => {
                const isNonFinished = row.pendentes > 0;
                return (
                  <tr 
                    key={row.id || i} 
                    className={`transition-colors ${isNonFinished ? 'bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                  >
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 dark:text-slate-300">{row.base}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 font-mono">{row.ul}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[120px]">{row.leiturista}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900 dark:text-slate-100">{row.aRealizar}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-600 dark:text-emerald-400">{row.realizadas}</td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-600 dark:text-amber-500">{row.pendentes}</td>
                    <td className="px-4 py-3 text-xs font-bold text-blue-600 dark:text-blue-400">{row.leituras100}</td>
                    <td className="px-4 py-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">{row.leituras30}</td>
                    <td className="px-4 py-3 text-xs font-black text-rose-600 dark:text-rose-400">
                      {formatPercent(calculateRowPercent(row))}
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Nenhum registro encontrado para este status.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Página {currentPage} de {totalPages || 1} — {sortedData.length} registros encontrados
          </p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => {
                 setCurrentPage(p => p - 1);
              }}
              className="p-2 w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-left text-xs dark:text-slate-300"></i>
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => {
                setCurrentPage(p => p + 1);
              }}
              className="p-2 w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-right text-xs dark:text-slate-300"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
