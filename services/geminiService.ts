import { GoogleGenAI, Type } from "@google/genai";
import { Move, Pokemon, PvERoundResult, TurnResult } from "../types";

const createClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing in environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Original PvE full round processor
export const processTurn = async (
  player: Pokemon,
  playerMove: Move,
  enemy: Pokemon
): Promise<PvERoundResult> => {
  const ai = createClient();
  
  const prompt = `
    模拟一场回合制宝可梦对战。
    
    玩家状态:
    - 名称: ${player.name}
    - 属性: ${player.type}
    - 当前 HP: ${player.currentHp} / ${player.maxHp}
    - 使用招式: ${playerMove.name} (属性: ${playerMove.type}, 威力: ${playerMove.power})

    对手状态:
    - 名称: ${enemy.name}
    - 属性: ${enemy.type}
    - 当前 HP: ${enemy.currentHp} / ${enemy.maxHp}
    
    规则:
    1. 计算玩家招式对对手造成的伤害。请考虑属性克制 (例如水克火 2倍伤害，火克草 2倍伤害，电克水 等等)。
    2. 如果当前 HP 归零，判定战斗结束。
    3. 如果对手存活，选择一个符合对手属性或常规逻辑的反击招式，并计算对玩家造成的伤害 (同样考虑属性克制)。
    4. 生成一段简短、激动人心的中文战斗解说，描述双方的动作和效果 (如"效果拔群", "效果不好"等)。
    
    伤害计算参考公式:
    Damage = (MovePower * (Attack/Defense) * TypeMultiplier) / 2 + random_variation
    假设双方攻防属性相近。普通伤害约在 15-40 之间，效果拔群可达 50-80。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            playerDamage: { type: Type.INTEGER, description: "Damage dealt by player to enemy" },
            enemyDamage: { type: Type.INTEGER, description: "Damage dealt by enemy to player (0 if enemy died)" },
            enemyMoveName: { type: Type.STRING, description: "Name of the move used by enemy" },
            logMessage: { type: Type.STRING, description: "A vivid Chinese description of the turn events" },
            isSuperEffectivePlayer: { type: Type.BOOLEAN, description: "True if player move was super effective" },
            isSuperEffectiveEnemy: { type: Type.BOOLEAN, description: "True if enemy move was super effective" },
            winner: { type: Type.STRING, enum: ["player", "enemy", "none"], description: "Who won this turn (if hp dropped to 0). Use 'none' if battle continues." },
          },
          required: ["playerDamage", "enemyDamage", "enemyMoveName", "logMessage", "isSuperEffectivePlayer", "isSuperEffectiveEnemy", "winner"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      playerDamage: result.playerDamage ?? 0,
      enemyDamage: result.enemyDamage ?? 0,
      enemyMoveName: result.enemyMoveName ?? "撞击",
      logMessage: result.logMessage ?? "双方正在对峙...",
      isSuperEffectivePlayer: result.isSuperEffectivePlayer ?? false,
      isSuperEffectiveEnemy: result.isSuperEffectiveEnemy ?? false,
      winner: (result.winner === 'none' ? null : result.winner) as 'player' | 'enemy' | null,
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      playerDamage: 15,
      enemyDamage: 0,
      enemyMoveName: "发呆",
      logMessage: "通讯受到干扰，AI 正在重新连接...",
      isSuperEffectivePlayer: false,
      isSuperEffectiveEnemy: false,
      winner: null,
    };
  }
};

// New PvP single turn processor
export const processPvPMove = async (
  attacker: Pokemon,
  move: Move,
  defender: Pokemon
): Promise<TurnResult> => {
  const ai = createClient();
  
  const prompt = `
    模拟回合制对战中的单次攻击。
    
    攻击方:
    - 名称: ${attacker.name}
    - 属性: ${attacker.type}
    - 使用招式: ${move.name} (属性: ${move.type}, 威力: ${move.power})

    防守方:
    - 名称: ${defender.name}
    - 属性: ${defender.type}
    - 当前 HP: ${defender.currentHp} / ${defender.maxHp}
    
    规则:
    1. 计算攻击造成的伤害。考虑属性克制。
    2. 生成一段简短、激动的中文解说，描述攻击效果。
    
    伤害参考: 普通 15-40，拔群 50-80。
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            damage: { type: Type.INTEGER, description: "Damage dealt" },
            logMessage: { type: Type.STRING, description: "Description of the attack" },
            isSuperEffective: { type: Type.BOOLEAN, description: "True if super effective" },
          },
          required: ["damage", "logMessage", "isSuperEffective"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    
    return {
      damage: result.damage ?? 0,
      logMessage: result.logMessage ?? `${attacker.name} 发动了攻击！`,
      isSuperEffective: result.isSuperEffective ?? false,
      winner: null // Winner is handled by the app logic based on HP
    };

  } catch (error) {
    console.error("Gemini API Error (PvP):", error);
    return {
      damage: 15,
      logMessage: "网络波动，攻击勉强命中...",
      isSuperEffective: false,
      winner: null,
    };
  }
};