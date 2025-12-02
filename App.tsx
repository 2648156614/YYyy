import React, { useState, useEffect, useRef } from 'react';
import { GameState, Pokemon, Move, GameMode, PlayerId } from './types';
import { POKEMON_STARTERS, ENEMIES } from './constants';
import PokemonCard from './components/PokemonCard';
import BattleArena from './components/BattleArena';
import { processTurn, processPvPMove } from './services/geminiService';
import { RotateCcw, Users, User, Swords } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [gameMode, setGameMode] = useState<GameMode>('PVE');
  const [turnPlayer, setTurnPlayer] = useState<PlayerId>('p1');
  
  const [playerPokemon, setPlayerPokemon] = useState<Pokemon | null>(null);
  const [enemyPokemon, setEnemyPokemon] = useState<Pokemon | null>(null);
  
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  
  // Animation states
  const [isPlayerHit, setIsPlayerHit] = useState(false);
  const [isEnemyHit, setIsEnemyHit] = useState(false);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // --- Game Flow Control ---

  const selectGameMode = (mode: GameMode) => {
    setGameMode(mode);
    setGameState(GameState.SELECTING_P1);
    setLogs([]);
  };

  const handlePokemonSelect = (selected: Pokemon) => {
    const pokemonCopy = JSON.parse(JSON.stringify(selected));

    if (gameState === GameState.SELECTING_P1) {
      setPlayerPokemon(pokemonCopy);
      if (gameMode === 'PVE') {
        startPvEGame(pokemonCopy);
      } else {
        setGameState(GameState.SELECTING_P2);
      }
    } else if (gameState === GameState.SELECTING_P2) {
      setEnemyPokemon(pokemonCopy); // In PvP, "enemy" is Player 2
      startPvPGame(playerPokemon!, pokemonCopy);
    }
  };

  const startPvEGame = (p1: Pokemon) => {
    const randomEnemy = ENEMIES[Math.floor(Math.random() * ENEMIES.length)];
    const enemyCopy = JSON.parse(JSON.stringify(randomEnemy));
    setEnemyPokemon(enemyCopy);
    setGameState(GameState.BATTLE);
    setLogs([`野生 ${enemyCopy.name} 出现了!`, `去吧! ${p1.name}!`, `请选择招式开始战斗!`]);
    setTurnCount(0);
    setTurnPlayer('p1');
  };

  const startPvPGame = (p1: Pokemon, p2: Pokemon) => {
    setGameState(GameState.BATTLE);
    setLogs([`好友对战开始!`, `${p1.name} VS ${p2.name}`, `请 P1 选择招式!`]);
    setTurnCount(0);
    setTurnPlayer('p1');
  };

  // --- Battle Logic ---

  const handleMove = async (move: Move) => {
    if (isProcessing) return;
    
    if (gameMode === 'PVE') {
      await handlePvEMove(move);
    } else {
      await handlePvPMove(move);
    }
  };

  const handlePvEMove = async (move: Move) => {
    if (!playerPokemon || !enemyPokemon) return;
    setIsProcessing(true);
    setLogs(prev => [...prev, `[P1] ${playerPokemon.name} 使用了 ${move.name}!`]);
    
    // Player Attack Animation (Wait for 600ms animation)
    setIsPlayerAttacking(true);
    setTimeout(() => setIsPlayerAttacking(false), 600);

    const result = await processTurn(playerPokemon, move, enemyPokemon);

    // Update Enemy (P1 Attack)
    setIsEnemyHit(true);
    setTimeout(() => setIsEnemyHit(false), 600);

    setEnemyPokemon(prev => {
      if (!prev) return null;
      return { ...prev, currentHp: Math.max(0, prev.currentHp - result.playerDamage) };
    });

    setLogs(prev => [...prev, `回合 ${turnCount + 1}: ${result.logMessage}`]);
    setTurnCount(c => c + 1);

    // Check P1 Win
    if (result.winner === 'player' || (enemyPokemon.currentHp - result.playerDamage) <= 0) {
      finishGame(playerPokemon.name);
      return;
    }

    // Update Player (Enemy Counter)
    if (result.enemyDamage > 0) {
      setTimeout(() => {
        setIsEnemyAttacking(true);
        setTimeout(() => setIsEnemyAttacking(false), 600);

        setTimeout(() => {
          setIsPlayerHit(true);
          setTimeout(() => setIsPlayerHit(false), 600);
          
          setPlayerPokemon(prev => {
            if (!prev) return null;
            return { ...prev, currentHp: Math.max(0, prev.currentHp - result.enemyDamage) };
          });

          if (result.winner === 'enemy' || (playerPokemon.currentHp - result.enemyDamage) <= 0) {
            setLogs(prev => [...prev, `${playerPokemon.name} 倒下了...`]);
            setGameState(GameState.GAME_OVER);
          }
          setIsProcessing(false);
        }, 500); // Delay impact slightly after attack starts
      }, 1000);
    } else {
      setIsProcessing(false);
    }
  };

  const handlePvPMove = async (move: Move) => {
    if (!playerPokemon || !enemyPokemon) return;
    setIsProcessing(true);

    const isP1Turn = turnPlayer === 'p1';
    const attacker = isP1Turn ? playerPokemon : enemyPokemon;
    const defender = isP1Turn ? enemyPokemon : playerPokemon;
    const setDefender = isP1Turn ? setEnemyPokemon : setPlayerPokemon;
    const setAttackingAnim = isP1Turn ? setIsPlayerAttacking : setIsEnemyAttacking;
    const setHitAnim = isP1Turn ? setIsEnemyHit : setIsPlayerHit;

    setLogs(prev => [...prev, `[${isP1Turn ? 'P1' : 'P2'}] ${attacker.name} 使用了 ${move.name}!`]);
    
    // Attack Animation
    setAttackingAnim(true);
    setTimeout(() => setAttackingAnim(false), 600);

    const result = await processPvPMove(attacker, move, defender);

    // Wait a bit for processing feel, then apply hit
    setTimeout(() => {
        // Hit Animation
        setHitAnim(true);
        setTimeout(() => setHitAnim(false), 600);

        // Apply Damage
        setDefender(prev => {
          if (!prev) return null;
          return { ...prev, currentHp: Math.max(0, prev.currentHp - result.damage) };
        });

        setLogs(prev => [...prev, result.logMessage]);

        // Check Win
        if ((defender.currentHp - result.damage) <= 0) {
          finishGame(attacker.name);
          return;
        }

        // Switch Turn
        setTurnPlayer(prev => prev === 'p1' ? 'p2' : 'p1');
        setTurnCount(c => c + 0.5); // Increment half turn
        setIsProcessing(false);
    }, 600); // Sync hit with end of attack animation
  };

  const finishGame = (winnerName: string) => {
    setLogs(prev => [...prev, `战斗结束! ${winnerName} 获胜!`]);
    setGameState(GameState.GAME_OVER);
    setIsProcessing(false);
  };

  const resetGame = () => {
    setGameState(GameState.MENU);
    setPlayerPokemon(null);
    setEnemyPokemon(null);
    setLogs([]);
    setTurnCount(0);
  };

  // --- Render Helpers ---

  const getActivePokemonMoves = () => {
    if (gameState !== GameState.BATTLE) return [];
    if (gameMode === 'PVE') return playerPokemon?.moves || [];
    return turnPlayer === 'p1' ? playerPokemon?.moves || [] : enemyPokemon?.moves || [];
  };

  const getActivePokemonColor = () => {
      if (gameState !== GameState.BATTLE) return 'bg-slate-100';
      if (gameMode === 'PVE') return 'bg-slate-100';
      return turnPlayer === 'p1' ? 'bg-blue-100 border-blue-300' : 'bg-red-100 border-red-300';
  }

  const moves = getActivePokemonMoves();

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 p-3 text-center shadow-md z-30 shrink-0 flex justify-between items-center px-6">
        <h1 className="text-xl md:text-2xl text-yellow-400 font-bold tracking-widest drop-shadow-md flex items-center gap-2">
          <Swords size={24} />
          <span>宝可梦大对决</span>
        </h1>
        {gameState === GameState.BATTLE && gameMode === 'PVP' && (
             <div className="bg-slate-700 px-4 py-1 rounded-full text-white font-bold animate-pulse border border-slate-500 text-sm md:text-base">
                当前回合: {turnPlayer === 'p1' ? 'P1 (蓝方)' : 'P2 (红方)'}
             </div>
        )}
      </header>

      {/* Main Content Area - CHANGED: overflow-y-auto to allow scrolling on small screens */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col">
        
        {/* MENU STATE */}
        {gameState === GameState.MENU && (
           <div className="flex-1 flex flex-col items-center justify-center space-y-8 p-6 bg-[url('https://images.unsplash.com/photo-1630412850381-42045e7e595a?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center min-h-screen">
             <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"></div>
             <div className="relative z-10 text-center space-y-8 my-auto">
                <h2 className="text-4xl text-white font-black mb-8">选择对战模式</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                    <button 
                        onClick={() => selectGameMode('PVE')}
                        className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-2xl shadow-2xl hover:scale-105 transition-all border-2 border-blue-400"
                    >
                        <User className="w-16 h-16 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl text-white font-bold">单人挑战 (PvE)</h3>
                        <p className="text-blue-200 mt-2">挑战 AI 控制的宝可梦</p>
                    </button>
                    <button 
                        onClick={() => selectGameMode('PVP')}
                        className="group relative overflow-hidden bg-gradient-to-br from-red-600 to-red-800 p-8 rounded-2xl shadow-2xl hover:scale-105 transition-all border-2 border-red-400"
                    >
                        <Users className="w-16 h-16 text-white mx-auto mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl text-white font-bold">好友对战 (PvP)</h3>
                        <p className="text-red-200 mt-2">与朋友进行面对面回合制PK</p>
                    </button>
                </div>
             </div>
           </div>
        )}

        {/* SELECTING STATE */}
        {(gameState === GameState.SELECTING_P1 || gameState === GameState.SELECTING_P2) && (
          <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-900 min-h-full">
            <h2 className="text-3xl text-white mb-2 font-bold mt-4">
                {gameState === GameState.SELECTING_P1 
                    ? (gameMode === 'PVE' ? '选择你的出战宝可梦' : '玩家 1 (P1) 请选择') 
                    : '玩家 2 (P2) 请选择'}
            </h2>
             {gameMode === 'PVP' && (
                <p className="text-slate-400 mb-6">轮流选择，公平竞技！</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl mb-8">
              {POKEMON_STARTERS.concat(gameMode === 'PVP' ? ENEMIES : []).map(p => (
                <PokemonCard key={p.id} pokemon={p} onSelect={handlePokemonSelect} />
              ))}
            </div>
            <button onClick={resetGame} className="mb-8 text-slate-400 hover:text-white underline">
                返回主菜单
            </button>
          </div>
        )}

        {/* BATTLE STATE */}
        {(gameState === GameState.BATTLE || gameState === GameState.GAME_OVER) && playerPokemon && enemyPokemon && (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950 z-0 h-full w-full fixed" />
            
            {/* Arena Container */}
            <div className="relative z-10 flex-1 w-full max-w-6xl mx-auto flex flex-col min-h-0">
                <BattleArena 
                    player={playerPokemon} 
                    enemy={enemyPokemon} 
                    isPlayerHit={isPlayerHit}
                    isEnemyHit={isEnemyHit}
                    isPlayerAttacking={isPlayerAttacking}
                    isEnemyAttacking={isEnemyAttacking}
                />
            </div>

            {/* Controls / Logs */}
            <div className="relative z-20 bg-slate-800 border-t-4 border-slate-700 shadow-[0_-5px_20px_rgba(0,0,0,0.6)] shrink-0 pb-safe">
               
               {/* Logs */}
               <div className="h-28 md:h-32 bg-black/50 p-3 overflow-y-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent border-b border-slate-700">
                  {logs.map((log, i) => (
                    <div key={i} className="mb-1 text-slate-200 border-l-2 border-yellow-500 pl-2 animate-fadeIn">
                      {log}
                    </div>
                  ))}
                  {isProcessing && (
                      <div className="flex items-center text-yellow-400 mt-2 text-sm">
                        <span className="mr-2 animate-pulse">AI 裁判正在计算...</span>
                      </div>
                  )}
                  <div ref={logsEndRef} />
               </div>

               {/* Buttons Area - Added background color for visibility */}
               <div className="bg-slate-800 p-3 pb-8 md:pb-6">
                 <div className="grid grid-cols-2 gap-3 max-w-4xl mx-auto">
                   {gameState === GameState.BATTLE ? (
                     moves.length > 0 ? (
                       moves.map((move, idx) => (
                         <button
                           key={idx}
                           disabled={isProcessing}
                           onClick={() => handleMove(move)}
                           className={`
                             flex flex-col items-center justify-center p-3 rounded-lg border-b-4 
                             transition-all duration-200 active:scale-95 active:border-b-0 active:translate-y-1
                             ${isProcessing 
                               ? 'bg-slate-700 border-slate-600 text-slate-500 cursor-not-allowed opacity-50' 
                               : `${getActivePokemonColor()} hover:brightness-110 shadow-lg`
                             }
                           `}
                         >
                           <span className="font-bold text-slate-900 text-lg">{move.name}</span>
                           <span className="text-xs text-slate-700 bg-white/40 px-2 rounded-full mt-1 font-semibold">{move.type}</span>
                         </button>
                       ))
                     ) : (
                       <div className="col-span-2 text-center text-white py-4">无可用招式 (数据错误)</div>
                     )
                   ) : (
                     <button
                       onClick={resetGame}
                       className="col-span-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 md:py-4 rounded-xl flex items-center justify-center text-lg md:text-xl shadow-xl transition-transform hover:scale-[1.02]"
                     >
                       <RotateCcw className="mr-2" />
                       返回主菜单
                     </button>
                   )}
                 </div>
               </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;