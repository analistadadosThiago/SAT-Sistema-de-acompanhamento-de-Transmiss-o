
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { TransmissionData } from '../types';

interface ChartsSectionProps {
  data: TransmissionData[];
  isDarkMode: boolean;
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ data, isDarkMode }) => {
  const [groupBy, setGroupBy] = useState<'razao' | 'base' | 'matricula'>('razao');

  const chartData = useMemo(() => {
    const aggMap = new Map<string, { name: string; realizadas: number; pendentes: number }>();

    data.forEach(item => {
      let key = '';
      if (groupBy === 'razao') key = item.razao;
      else if (groupBy === 'base') key = item.base;
      else if (groupBy === 'matricula') key = item.matricula;
      
      if (!key) return;
      const current = aggMap.get(key) || { name: key, realizadas: 0, pendentes: 0 };
      current.realizadas += item.realizadas;
      current.pendentes += item.pendentes;
      aggMap.set(key, current);
    });

    return Array.from(aggMap.values())
      // Ordenação crescente (A -> Z) pelo nome do grupo
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
      .slice(0, 50); 
  }, [data, groupBy]);

  // Cores dinâmicas para os eixos do Recharts baseadas no estado isDarkMode
  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f8fafc' : '#1e293b';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Gráfico Comparativo</h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            Análise de Leituras realizadas/não-realizadas – por Razão, Base Operativa e Matrícula
          </p>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1 text-center md:text-left">Agrupar visualização por:</label>
          <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button 
              onClick={() => setGroupBy('razao')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'razao' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              RAZÃO
            </button>
            <button 
              onClick={() => setGroupBy('base')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'base' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              BASE
            </button>
            <button 
              onClick={() => setGroupBy('matricula')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'matricula' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              MATRÍCULA
            </button>
          </div>
        </div>
      </div>

      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              tick={{ fontSize: 9, fontWeight: 700, fill: axisColor }} 
            />
            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: axisColor }} />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                fontSize: '12px', 
                fontWeight: 'bold',
                backgroundColor: tooltipBg,
                color: tooltipText
              }} 
              cursor={{ fill: isDarkMode ? '#334155' : '#f8fafc' }}
            />
            <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}/>
            <Bar dataKey="realizadas" name="Realizadas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25}>
              <LabelList dataKey="realizadas" position="top" style={{ fill: '#10b981', fontSize: '9px', fontWeight: 'bold' }} />
            </Bar>
            <Bar dataKey="pendentes" name="Pendentes" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={25}>
              <LabelList dataKey="pendentes" position="top" style={{ fill: '#f59e0b', fontSize: '9px', fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsSection;
