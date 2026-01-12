
import React from 'react';
import { DashboardStats } from '../types';

interface StatsCardsProps {
  stats: DashboardStats;
}

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const cards = [
    {
      title: 'Leituras a Realizar',
      value: stats.totalARealizar,
      icon: 'fa-list-ol',
      color: 'bg-blue-600',
    },
    {
      title: 'Leituras Realizadas',
      value: stats.totalRealizadas,
      icon: 'fa-check-double',
      color: 'bg-emerald-600',
    },
    {
      title: 'Leituras Pendentes',
      value: stats.totalPendentes,
      icon: 'fa-triangle-exclamation',
      color: 'bg-amber-600',
    },
    {
      title: '% Pendentes',
      // Formatação obrigatória: 0,00%
      value: `${stats.percentualPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`,
      icon: 'fa-percent',
      color: 'bg-rose-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm p-5 flex items-center border border-slate-200">
          <div className={`${card.color} w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg mr-4`}>
            <i className={`fa-solid ${card.icon}`}></i>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.title}</p>
            <p className="text-xl font-black text-slate-800 tracking-tight">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
