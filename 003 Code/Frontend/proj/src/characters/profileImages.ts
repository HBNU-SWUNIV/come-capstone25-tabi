// src/assets/profile/profileImages.ts
export const characterImageMap: Record<string, any> = {
  // 예) 서버에서 '/profile-characters/owl_1.png' 내려오면
  // fileName === 'owl_1.png' 로 매칭됨
  'owl_1.png': require('./owl_1.png'),
  'squirrel_1.png': require('./squirrel_1.png'),
  'squirrel_2.png': require('./squirrel_2.png'),
  'squirrel_3.png': require('./squirrel_3.png'),
  'squirrel_4.png': require('./squirrel_4.png'),
  'snake_1.png': require('./snake_1.png'),
  'snake_2.png': require('./snake_2.png'),
  'snake_3.png': require('./snake_3.png'),
  'snake_4.png': require('./snake_4.png'),
  'turtle_1.png': require('./turtle_1.png'),
  'turtle_2.png': require('./turtle_2.png'),
  'turtle_3.png': require('./turtle_3.png'),
  'turtle_4.png': require('./turtle_4.png'),
  // 필요시 계속 추가...
};

export function getLocalProfileImage(path?: string) {
  if (!path) return undefined;
  // '/profile-characters/owl_1.png' -> 'owl_1.png'
  const fileName = path.split('/').pop() || '';
  return characterImageMap[fileName];
}
