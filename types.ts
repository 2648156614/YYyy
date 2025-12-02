export interface Move {
  name: string;
  type: string;
  power: number;
}

export interface Pokemon {
  id: number;
  name: string;
  type: string;
  maxHp: number;
  currentHp: number;
  spriteBack: string;
  spriteFront: string;
  moves: Move[];
  color: string;
}

export interface TurnResult {
  damage: number;       // Damage dealt to the defender
  logMessage: string;
  isSuperEffective: boolean;
  winner: 'player' | 'enemy' | null; // Keeps compatibility, though context changes in PvP
}

// Legacy support for PvE full round result
export interface PvERoundResult {
  playerDamage: number;
  enemyDamage: number;
  enemyMoveName: string;
  logMessage: string;
  isSuperEffectivePlayer: boolean;
  isSuperEffectiveEnemy: boolean;
  winner: 'player' | 'enemy' | null;
}

export enum GameState {
  MENU = 'MENU',
  SELECTING_P1 = 'SELECTING_P1',
  SELECTING_P2 = 'SELECTING_P2',
  BATTLE = 'BATTLE',
  GAME_OVER = 'GAME_OVER',
}

export type GameMode = 'PVE' | 'PVP';
export type PlayerId = 'p1' | 'p2';