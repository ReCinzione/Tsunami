const XP_CONSTANTS = {
  LEVEL_BASE: 100,
  LEVEL_MULTIPLIER: 1.5
};

function getXPRequiredForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(XP_CONSTANTS.LEVEL_BASE * Math.pow(XP_CONSTANTS.LEVEL_MULTIPLIER, level - 2));
}

function getTotalXPForLevel(level) {
  if (level <= 1) return 0;
  
  let totalXP = 0;
  for (let i = 2; i <= level; i++) {
    totalXP += getXPRequiredForLevel(i);
  }
  
  return totalXP;
}

function calculateLevelFromXP(totalXP) {
  if (totalXP <= 0) return 1;
  
  let level = 1;
  let xpRequired = 0;
  
  while (xpRequired < totalXP) {
    xpRequired += getXPRequiredForLevel(level);
    if (xpRequired <= totalXP) {
      level++;
    }
  }
  
  return Math.max(1, level - 1);
}

console.log('XP per livello:');
for(let i = 1; i <= 10; i++) {
  const totalXP = getTotalXPForLevel(i);
  const levelXP = getXPRequiredForLevel(i);
  console.log(`Livello ${i}: ${totalXP} XP totali (${levelXP} XP per questo livello)`);
}

console.log('\nCon 1037 XP:');
const calculatedLevel = calculateLevelFromXP(1037);
console.log(`Livello calcolato: ${calculatedLevel}`);

console.log('\nDettaglio calcolo per 1037 XP:');
let level = 1;
let xpAccumulated = 0;
while (xpAccumulated < 1037) {
  const xpForThisLevel = getXPRequiredForLevel(level);
  const newTotal = xpAccumulated + xpForThisLevel;
  console.log(`Livello ${level}: ${xpForThisLevel} XP (totale: ${newTotal})`);
  
  if (newTotal <= 1037) {
    xpAccumulated = newTotal;
    level++;
  } else {
    break;
  }
}
console.log(`Risultato: Livello ${level - 1} con ${xpAccumulated} XP accumulati`);