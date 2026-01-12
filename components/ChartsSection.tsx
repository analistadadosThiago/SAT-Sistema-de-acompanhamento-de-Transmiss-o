
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import { TransmissionData } from '../types';

interface ChartsSectionProps {
  data: TransmissionData[];
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ data }) => {
  const [groupBy, setGroupBy] = useState<'razao' | 'base'>('razao');

  const chartData = useMemo(() => {
    const aggMap = new Map<string, { name: string; realizadas: number; pendentes: number }>();

    data.forEach(item => {
      const key = groupBy === 'razao' ? item.razao : item.base;
      if (!key) return;
      const current = aggMap.get(key) || { name: key, realizadas: 0, pendentes: 0 };
      current.realizadas += item.realizadas;
      current.pendentes += item.pendentes;
      aggMap.set(key, current);
    });

    return Array.from(aggMap.values())
      .sort((a, b) => (b.pendentes + b.realizadas) - (a.pendentes + a.realizadas))
      .slice(0, 20);
  }, [data, groupBy]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h3 className="text-lg font-black text-slate-800">Gráfico Comparativo</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Análise de Realizadas vs Pendentes</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 text-center md:text-left">Agrupar visualização por:</label>
          <div className="inline-flex p-1.5 bg-slate-100 rounded-xl border border-slate-200">
            <button 
              onClick={() => setGroupBy('razao')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'razao' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              RAZÃO
            </button>
            <button 
              onClick={() => setGroupBy('base')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${groupBy === 'base' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              BASE OPERATIVA
            </button>
          </div>
        </div>
      </div>

      <div className="h-[450px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 30, right: 10, left: 10, bottom: 80 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} 
            />
            <YAxis tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
            <Tooltip 
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} 
              cursor={{ fill: '#f8fafc' }}
            />
            <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}/>
            <Bar dataKey="realizadas" name="Realizadas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={25}>
              <LabelList dataKey="realizadas" position="top" style={{ fill: '#059669', fontSize: '9px', fontWeight: 'bold' }} />
            </Bar>
            <Bar dataKey="pendentes" name="Pendentes" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={25}>
              <LabelList dataKey="pendentes" position="top" style={{ fill: '#d97706', fontSize: '9px', fontWeight: 'bold' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsSection;
