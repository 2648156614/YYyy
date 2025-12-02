import React from 'react';
import { Pokemon } from '../types';
import HealthBar from './HealthBar';

interface BattleArenaProps {
  player: Pokemon;
  enemy: Pokemon;
  isPlayerHit: boolean;
  isEnemyHit: boolean;
  isPlayerAttacking: boolean;
  isEnemyAttacking: boolean;
}

const BattleArena: React.FC<BattleArenaProps> = ({ 
  player, 
  enemy, 
  isPlayerHit, 
  isEnemyHit,
  isPlayerAttacking,
  isEnemyAttacking
}) => {
  return (
    <div className="flex-1 flex flex-col justify-between py-4 px-4 md:px-12 w-full h-full min-h-[300px]">
      
      {/* Enemy Area (Top Right) */}
      <div className="flex flex-col items-end w-full animate-slideInRight">
        {/* Enemy Health - Positioned clearly */}
        <div className="mb-4 mr-2 md:mr-10 z-10 w-full flex justify-end">
            <HealthBar current={enemy.currentHp} max={enemy.maxHp} label={enemy.name} isEnemy={true} />
        </div>
        
        {/* Enemy Sprite */}
        <div className="relative mr-8 md:mr-24 mb-4">
             <div className="w-24 h-6 md:w-40 md:h-8 bg-black/30 rounded-[50%] absolute bottom-2 left-1/2 -translate-x-1/2 blur-md" />
            <img 
                src={enemy.spriteFront} 
                alt={enemy.name}
                className={`w-32 h-32 md:w-56 md:h-56 object-contain z-10 
                    ${isEnemyHit ? 'animate-damage' : ''}
                    ${isEnemyAttacking ? 'animate-tackle-enemy' : ''}
                `} 
            />
        </div>
      </div>

      {/* Player Area (Bottom Left) */}
      {/* Added mb-4 to ensure spacing from bottom control panel */}
      <div className="flex flex-col items-start w-full animate-slideInLeft mt-auto mb-4 md:mb-8">
         {/* Player Sprite */}
         <div className="relative ml-8 md:ml-24 mb-4">
            <div className="w-24 h-6 md:w-40 md:h-8 bg-black/30 rounded-[50%] absolute bottom-2 left-1/2 -translate-x-1/2 blur-md" />
            <img 
                src={player.spriteBack} 
                alt={player.name}
                className={`w-40 h-40 md:w-64 md:h-64 object-contain z-10 
                    ${isPlayerHit ? 'animate-damage' : ''}
                    ${isPlayerAttacking ? 'animate-tackle-player' : ''}
                `}
            />
         </div>
         
         {/* Player Health */}
         <div className="ml-2 md:ml-10 mb-2 z-10 w-full flex justify-start">
            <HealthBar current={player.currentHp} max={player.maxHp} label={player.name} isEnemy={false} />
         </div>
      </div>

    </div>
  );
};

export default BattleArena;