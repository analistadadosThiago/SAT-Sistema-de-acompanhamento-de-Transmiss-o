
import React, { useState, useMemo } from 'react';
import { TransmissionData } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface DataTableProps {
  data: TransmissionData[];
}

type TransStatus = 'Todos' | 'Completo' | 'Incompleto';

const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [transStatus, setTransStatus] = useState<TransStatus>('Todos');
  const itemsPerPage = 25;

  // Filtragem local conforme regra: Coluna Q (pendentes)
  const finalFilteredData = useMemo(() => {
    if (transStatus === 'Todos') return data;
    return data.filter(row => {
      if (transStatus === 'Completo') return row.pendentes === 0;
      if (transStatus === 'Incompleto') return row.pendentes > 0;
      return true;
    });
  }, [data, transStatus]);

  // Resumo consolidado baseado nos dados da tabela (finalFilteredData)
  const summary = useMemo(() => {
    const totalRealizadas = finalFilteredData.reduce((acc, curr) => acc + curr.realizadas, 0);
    const totalPendentes = finalFilteredData.reduce((acc, curr) => acc + curr.pendentes, 0);
    const totalARealizar = finalFilteredData.reduce((acc, curr) => acc + curr.aRealizar, 0);
    const percPendenteTotal = totalARealizar > 0 ? (totalPendentes / totalARealizar) * 100 : 0;

    return { totalRealizadas, totalPendentes, percPendenteTotal };
  }, [finalFilteredData]);

  const totalPages = Math.ceil(finalFilteredData.length / itemsPerPage);

  const paginatedData = finalFilteredData.slice(
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
    const ws = XLSX.utils.json_to_sheet(finalFilteredData.map(r => ({
      'BASE': r.base,
      'UL': r.ul,
      'LEITURAS A REALIZAR': r.aRealizar,
      'LEITURAS': r.realizadas,
      'LEITURAS Ñ REALIZADAS': r.pendentes,
      '% PENDENTE': formatPercent(calculateRowPercent(r))
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório SAT");
    XLSX.writeFile(wb, "relatorio_sat.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape');
    const tableData = finalFilteredData.map(r => [
      r.base, 
      r.ul, 
      r.aRealizar, 
      r.realizadas, 
      r.pendentes, 
      formatPercent(calculateRowPercent(r))
    ]);

    (doc as any).autoTable({
      head: [['BASE', 'UL', 'LEITURAS A REALIZAR', 'LEITURAS', 'LEITURAS Ñ REALIZADAS', '% PENDENTE']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7 },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'center' },
        4: { halign: 'center' },
        5: { halign: 'right' }
      }
    });
    doc.save("relatorio_sat.pdf");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-2 text-slate-500">
          <i className="fa-solid fa-list-check text-blue-600"></i>
          <h2 className="font-black uppercase text-[11px] tracking-widest">Análise de Quantidade de Leituras</h2>
        </div>

        {/* FILTRO - SELECIONE O STATUS DE TRANSMISSÃO */}
        <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-xl border border-slate-200 shadow-sm">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selecione o Status de transmissão:</label>
          <select 
            className="bg-transparent text-[10px] font-black text-blue-600 uppercase tracking-wider focus:outline-none cursor-pointer"
            value={transStatus}
            onChange={(e) => {
              setTransStatus(e.target.value as TransStatus);
              setCurrentPage(1);
            }}
          >
            <option value="Todos">Exibir Todos</option>
            <option value="Completo">Completo</option>
            <option value="Incompleto">Incompleto</option>
          </select>
        </div>
      </div>

      {/* RESUMO CONSOLIDADO ACIMA DA TABELA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex flex-col items-center">
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Leituras Realizadas</span>
          <span className="text-xl font-black text-emerald-700">{summary.totalRealizadas}</span>
        </div>
        <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex flex-col items-center">
          <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Total de Leituras Ñ Realizadas</span>
          <span className="text-xl font-black text-amber-700">{summary.totalPendentes}</span>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl flex flex-col items-center">
          <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">% Pendente Total</span>
          <span className="text-xl font-black text-rose-700">{formatPercent(summary.percPendenteTotal)}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Relação por Base/Razão</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acompanhamento detalhado das transmissões</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportToExcel} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all">
              <i className="fa-solid fa-file-excel"></i> Exportar Excel
            </button>
            <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-rose-100 hover:bg-rose-100 transition-all">
              <i className="fa-solid fa-file-pdf"></i> Exportar PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {[
                  'BASE', 
                  'UL', 
                  'LEITURAS A REALIZAR', 
                  'LEITURAS', 
                  'LEITURAS Ñ REALIZADAS', 
                  '% PENDENTE'
                ].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedData.map((row, i) => {
                const isNonFinished = row.pendentes > 0;
                return (
                  <tr 
                    key={row.id || i} 
                    className={`transition-colors ${isNonFinished ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{row.base}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{row.ul}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-900">{row.aRealizar}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-600">{row.realizadas}</td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-600">{row.pendentes}</td>
                    <td className="px-4 py-3 text-xs font-black text-rose-600">
                      {formatPercent(calculateRowPercent(row))}
                    </td>
                  </tr>
                );
              })}
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nenhum registro encontrado para este status.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Página {currentPage} de {totalPages || 1} — {finalFilteredData.length} registros encontrados
          </p>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => {
                 setCurrentPage(p => p - 1);
                 window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="p-2 w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button 
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => {
                setCurrentPage(p => p + 1);
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              className="p-2 w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 transition-all shadow-sm"
            >
              <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
