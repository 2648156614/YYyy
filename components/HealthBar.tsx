import React from 'react';

interface HealthBarProps {
  current: number;
  max: number;
  label: string;
  isEnemy?: boolean;
}

const HealthBar: React.FC<HealthBarProps> = ({ current, max, label, isEnemy = false }) => {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  let colorClass = 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]';
  if (percentage < 50) colorClass = 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.6)]';
  if (percentage < 20) colorClass = 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]';

  // PvP Support: Blue for player (P1), Red-tinted for enemy (P2/AI) container
  const containerBorder = isEnemy ? 'border-red-500/50' : 'border-blue-500/50';
  const labelColor = isEnemy ? 'text-red-100' : 'text-blue-100';

  return (
    <div className={`w-64 md:w-72 bg-slate-900/90 p-2 md:p-3 rounded-xl border-2 ${containerBorder} shadow-xl backdrop-blur-md`}>
      <div className="flex justify-between items-end mb-1">
        <span className={`font-bold tracking-wider text-base md:text-lg drop-shadow-md ${labelColor}`}>{label}</span>
        <span className="text-xs md:text-sm font-mono text-slate-300">{current} / {max}</span>
      </div>
      <div className="relative w-full h-3 md:h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
        <div 
          className={`h-full ${colorClass} transition-all duration-700 ease-out relative`} 
          style={{ width: `${percentage}%` }}
        >
             <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/30" />
             <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20" />
        </div>
      </div>
    </div>
  );
};

export default HealthBar;