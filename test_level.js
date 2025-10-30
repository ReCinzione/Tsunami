// Test del calcolo del livello con la logica di Supabase
function calculateLevelFromXP(totalXP) {
  if (totalXP <= 0) return 1;
  
  // Soglie XP come in Supabase
  if (totalXP >= 11500) return 10;
  if (totalXP >= 10500) return 9;
  if (totalXP >= 7800) return 8;
  if (totalXP >= 5600) return 7;
  if (totalXP >= 3850) return 6;
  if (totalXP >= 2500) return 5;
  if (totalXP >= 1500) return 4;
  if (totalXP >= 800) return 3;
  if (totalXP >= 350) return 2;
  if (totalXP >= 100) return 1;
  
  return 1;
}

console.log('Test con 1037 XP:');
console.log('Livello calcolato:', calculateLevelFromXP(1037));
console.log('\nSoglie XP:');
console.log('Livello 1: >= 100 XP');
console.log('Livello 2: >= 350 XP');
console.log('Livello 3: >= 800 XP');
console.log('Livello 4: >= 1500 XP');
console.log('\nCon 1037 XP dovrebbe essere livello 3 (>= 800 ma < 1500)');