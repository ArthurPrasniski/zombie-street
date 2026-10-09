import { useEffect, useState } from 'react';

import { CashLabel } from '@/ui/CashLabel';

// Poucos passos (não é por frame): o dinheiro sobe em ~0,8 s.
const STEPS = 16;
const STEP_MS = 50;

/** Dinheiro contando de 0 até o valor, com uma pequena espera antes. */
export function CountUp({ amount, size, delay = 0 }: { amount: number; size: number; delay?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let step = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      step++;
      // Desacelera no fim (ease-out)
      const t = 1 - (1 - step / STEPS) ** 3;
      setShown(Math.round(amount * t));
      if (step < STEPS) timer = setTimeout(tick, STEP_MS);
    };
    timer = setTimeout(tick, delay);
    return () => clearTimeout(timer);
  }, [amount, delay]);
  return <CashLabel amount={shown} size={size} />;
}
