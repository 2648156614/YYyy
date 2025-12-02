import React from 'react';
import { Pokemon } from '../types';

interface PokemonCardProps {
  pokemon: Pokemon;
  onSelect: (p: Pokemon) => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(pokemon)}
      className={`relative group overflow-hidden rounded-xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl border-4 border-slate-700 hover:border-white ${pokemon.color}`}
    >
      <div className="absolute top-0 right-0 p-2 opacity-50 text-6xl font-black text-white mix-blend-overlay">
        #{pokemon.id}
      </div>
      <div className="flex flex-col items-center">
        <img 
          src={pokemon.spriteFront} 
          alt={pokemon.name} 
          className="w-32 h-32 object-contain drop-shadow-md z-10 group-hover:scale-110 transition-transform" 
        />
        <h3 className="text-2xl font-bold text-white mt-2 drop-shadow-lg">{pokemon.name}</h3>
        <span className="inline-block px-3 py-1 mt-2 bg-black/30 rounded-full text-sm font-semibold text-white">
          {pokemon.type}
        </span>
      </div>
      <div className="mt-4 text-white/80 text-sm">
         <p>HP: {pokemon.maxHp}</p>
         <p>招式: {pokemon.moves.length} 个</p>
      </div>
    </button>
  );
};

export default PokemonCard;