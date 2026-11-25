import type { Db } from '../db';
import { dayOfMonth } from '../month';
import { budgetsService } from './budgets';
import { transactionsService } from './transactions';

// Antes de una semana, una sola compra grande ya parece un ritmo para pasarse del tope.
const MIN_DAY = 7;

export type Insight = { tone: 'warning' | 'good'; text: string };

/**
 * Hasta 3 frases para Resumen sobre cómo va el mes: categorías que ya superan con creces el
 * mes pasado y topes que, al ritmo de hoy, se van a pasar.
 */
export function insightsService(db: Db) {
  return {
    list(now = new Date()): Insight[] {
      const tx = transactionsService(db);
      const current = tx.monthSummary(now).byCategory;
      const previous = tx.monthSummary(now, 1).byCategory;
      const budgets = budgetsService(db).list(now);
      const { day, days } = dayOfMonth(now);
      const out: Insight[] = [];

      for (const b of budgets) {
        if (b.spentMinor > b.limitMinor) {
          out.push({ tone: 'warning', text: `Ya te pasaste del tope de ${b.name}.` });
        } else if (day >= MIN_DAY && b.spentMinor * BigInt(days) > b.limitMinor * BigInt(day)) {
          // Gasto de hoy proyectado a todo el mes: gastado / día × días > tope.
          out.push({ tone: 'warning', text: `A este ritmo te pasas del tope de ${b.name}.` });
        }
      }

      for (const c of current) {
        const before = previous.find((p) => p.id === c.id)?.amountMinor ?? 0n;
        // 30 % o más sobre todo el mes pasado; sin mes pasado no hay con qué comparar.
        if (c.name && before > 0n && c.amountMinor * 10n >= before * 13n) {
          const pct = ((c.amountMinor - before) * 100n) / before;
          out.push({
            tone: 'warning',
            text: `Ya gastaste ${pct}% más en ${c.name} que en todo el mes pasado.`,
          });
        }
      }

      if (!out.length && budgets.length) {
        out.push({ tone: 'good', text: 'Vas bien con todos tus topes este mes.' });
      }
      return out.slice(0, 3);
    },
  };
}
