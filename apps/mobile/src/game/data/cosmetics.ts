export const MASTERY_GOALS = [25,100,500];
export const TRUCK_PAINTS = { stock: '#8fa874', crimson: '#db655b', arctic: '#78cce0', season: '#c695ff' };
export type TruckPaint = keyof typeof TRUCK_PAINTS;
export const masteryTier = (uses: number) => MASTERY_GOALS.filter((goal) => uses >= goal).length;
