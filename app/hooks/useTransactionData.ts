import { useMemo } from "react";
import { format } from "date-fns";
import { Transaction } from "../interfaces/transaction.interface";
import robustParseDateString from "../utils/robustParseDateString";

const TRANSACTION_TYPES = {
  EXPENSE: 'gasto',
  INCOME: 'ingreso'
} as const;

type Stats = {
  income: number;
  expenses: number;
  balance: number;
};

function useTransactionData(transactions: Transaction[], selectedDate: Date | null, referenceDay: Date) {
  return useMemo(() => {
    const monthKey = format(selectedDate || referenceDay, "yyyy-MM");

    const completed = transactions.filter(
      (t): t is Transaction => !!(t.status === "completed" && robustParseDateString(t.dueDate))
    );

    const monthlyTxs = completed.filter(t => {
      const d = robustParseDateString(t.dueDate);
      return d && format(d, "yyyy-MM") === monthKey;
    });

    const stats = monthlyTxs.reduce((acc: Stats, t) => {
      const amount = t.type === TRANSACTION_TYPES.EXPENSE ? -t.amount : t.amount;
      acc.balance += amount;
      if (t.type === TRANSACTION_TYPES.EXPENSE) {
        acc.expenses += t.amount;
      } else {
        acc.income += t.amount;
      }
      return acc;
    }, { income: 0, expenses: 0, balance: 0 });

    const filtered = selectedDate
      ? completed.filter(t => {
        const d = robustParseDateString(t.dueDate);
        return d && selectedDate && d.toDateString() === selectedDate.toDateString();
      })
      : completed;

    const grouped = Object.entries(
      filtered.reduce((acc, t) => {
        const d = robustParseDateString(t.dueDate);
        if (!d) return acc;
        const key = format(d, "dd-MM-yyyy");
        (acc[key] = acc[key] || []).push(t);
        return acc;
      }, {} as Record<string, Transaction[]>)
    )
      .map(([date, txs]: [string, Transaction[]]) => [date, txs.sort((a, b) => {
        const da = robustParseDateString(b.dueDate);
        const db = robustParseDateString(a.dueDate);
        return (da?.getTime() || 0) - (db?.getTime() || 0);
      })])
      .filter((entry): entry is [string, Transaction[]] =>
        Array.isArray(entry) &&
        entry.length === 2 &&
        typeof entry[0] === 'string' &&
        Array.isArray(entry[1])
      )
      .sort(([a], [b]) => {
        const [dayA, monthA, yearA] = (a as string).split("-").map(Number);
        const [dayB, monthB, yearB] = (b as string).split("-").map(Number);
        return yearB - yearA || monthB - monthA || dayB - dayA;
      });

    const dayMap = new Map(completed.map(t => {
      const d = robustParseDateString(t.dueDate);
      return d ? [d.toDateString(), true] : null;
    }).filter((entry): entry is [string, boolean] => entry !== null));

    return { dayMap, stats, grouped };
  }, [transactions, selectedDate, referenceDay]);
}

export default useTransactionData; 