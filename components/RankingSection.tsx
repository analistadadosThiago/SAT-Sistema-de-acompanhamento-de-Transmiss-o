
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { TransmissionData } from '../types';

interface RankingSectionProps {
  data: TransmissionData[];
  isDarkMode: boolean;
}

const RankingSection: React.FC<RankingSectionProps> = ({ data, isDarkMode }) => {
  const rankingData = useMemo(() => {
    const aggMap = new Map<string, number>();

    data.forEach(item => {
      const name = item.leiturista || 'Não Identificado';
      const current = aggMap.get(name) || 0;
      aggMap.set(name, current + item.pendentes);
    });

    return Array.from(aggMap.entries())
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 15); // Top 15 leituristas
  }, [data]);

  const axisColor = isDarkMode ? '#94a3b8' : '#64748b';
  const gridColor = isDarkMode ? '#334155' : '#f1f5f9';
  const tooltipBg = isDarkMode ? '#1e293b' : '#ffffff';
  const tooltipText = isDarkMode ? '#f8fafc' : '#1e293b';

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mt-8 transition-colors">
      <div className="mb-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">Ranking dos Leiturista com maiores pendencias:</h3>
      </div>

      <div className="h-[500px]">
        {rankingData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={rankingData} 
              layout="vertical" 
              margin={{ top: 5, right: 60, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={gridColor} />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 9, fontWeight: 700, fill: axisColor }} 
                width={150}
              />
              <Tooltip 
                cursor={{ fill: isDarkMode ? '#334155' : '#f8fafc' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  backgroundColor: tooltipBg,
                  color: tooltipText,
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="value" name="Pendências" radius={[0, 4, 4, 0]} barSize={20}>
                {rankingData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={index < 3 ? '#ef4444' : '#f59e0b'} />
                ))}
                <LabelList dataKey="value" position="right" style={{ fill: axisColor, fontSize: '10px', fontWeight: 'bold' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <i className="fa-solid fa-chart-bar text-4xl mb-3 opacity-20"></i>
            <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma pendência encontrada nos dados atuais.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingSection;
