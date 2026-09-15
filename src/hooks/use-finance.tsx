"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type {
  Account,
  CategoryId,
  Currency,
  FinanceState,
  FinancialSnapshot,
  ScenarioId,
  Transaction,
} from "@/types/finance";
import { buildScenario, DEFAULT_SCENARIO } from "@/mocks/scenarios";
import { getSnapshot } from "@/lib/finance";
import { round2, toNio } from "@/lib/format";

/* ───────────────────────── Types ───────────────────────── */

export interface MovementInput {
  amount: number;
  currency: Currency;
  title: string;
  categoryId: CategoryId;
  accountId: string;
  note?: string;
}

export interface ReserveInput {
  amount: number;
  name: string;
  accountId: string;
}

export interface TransferInput {
  amount: number;
  fromId: string;
  toId: string;
}

export interface DemoFlags {
  /** Longer skeletons when switching scenarios. */
  slowLoading: boolean;
  /** Makes the simulator fail so the error state can be reviewed. */
  simulatorError: boolean;
}

type Action =
  | { type: "load"; state: FinanceState }
  | { type: "expense"; id: string; input: MovementInput }
  | { type: "income"; id: string; input: MovementInput }
  | { type: "reserve"; id: string; input: ReserveInput }
  | { type: "transfer"; id: string; input: TransferInput }
  | { type: "mark-received"; id: string }
  | { type: "omit"; id: string };

/* ───────────────────────── Reducer (in-memory only) ───────────────────────── */

function adjustBalance(accounts: Account[], id: string, delta: number): Account[] {
  return accounts.map((a) => (a.id === id ? { ...a, balance: round2(a.balance + delta) } : a));
}

function reducer(state: FinanceState, action: Action): FinanceState {
  switch (action.type) {
    case "load":
      return action.state;

    case "expense":
    case "income": {
      const { input } = action;
      const nio = round2(toNio(input.amount, input.currency, state.exchangeRate));
      const isIncome = action.type === "income";
      const tx: Transaction = {
        id: action.id,
        date: state.today,
        title: input.title,
        categoryId: input.categoryId,
        accountId: input.accountId,
        type: action.type,
        status: isIncome ? "received" : "paid",
        amount: input.amount,
        currency: input.currency,
        note: input.note,
      };
      return {
        ...state,
        accounts: adjustBalance(state.accounts, input.accountId, isIncome ? nio : -nio),
        transactions: [tx, ...state.transactions],
        changesToday: [...state.changesToday, { id: `chg-${action.id}`, label: input.title, delta: isIncome ? nio : -nio }],
      };
    }

    case "reserve": {
      const { input } = action;
      return {
        ...state,
        reserves: [
          ...state.reserves,
          { id: `res-${action.id}`, name: input.name, amount: input.amount, purpose: "expense", accountId: input.accountId },
        ],
        transactions: [
          {
            id: action.id,
            date: state.today,
            title: input.name,
            categoryId: "savings",
            accountId: input.accountId,
            type: "reserve",
            status: "reserved",
            amount: input.amount,
            currency: "NIO",
            note: "Sigue en tu cuenta, pero ya no cuenta como dinero libre.",
          },
          ...state.transactions,
        ],
        changesToday: [
          ...state.changesToday,
          { id: `chg-${action.id}`, label: `Reserva: ${input.name}`, delta: -input.amount },
        ],
      };
    }

    case "transfer": {
      const { input } = action;
      const from = state.accounts.find((a) => a.id === input.fromId);
      const to = state.accounts.find((a) => a.id === input.toId);
      if (!from || !to) return state;
      let accounts = adjustBalance(state.accounts, from.id, -input.amount);
      accounts = adjustBalance(accounts, to.id, input.amount);
      // Only transfers that cross the operational/savings boundary move free money.
      const delta = from.kind === to.kind ? 0 : from.kind === "operational" ? -input.amount : input.amount;
      return {
        ...state,
        accounts,
        transactions: [
          {
            id: action.id,
            date: state.today,
            title: `${from.shortName} → ${to.shortName}`,
            categoryId: "transfer",
            accountId: from.id,
            toAccountId: to.id,
            type: "transfer",
            status: "transferred",
            amount: input.amount,
            currency: "NIO",
          },
          ...state.transactions,
        ],
        changesToday: delta
          ? [...state.changesToday, { id: `chg-${action.id}`, label: `Transferencia a ${to.shortName}`, delta }]
          : state.changesToday,
      };
    }

    case "mark-received": {
      const tx = state.transactions.find((t) => t.id === action.id);
      if (!tx || tx.type !== "income" || !tx.accountId) return state;
      const nio = round2(toNio(tx.amount, tx.currency, state.exchangeRate));
      return {
        ...state,
        accounts: adjustBalance(state.accounts, tx.accountId, nio),
        transactions: state.transactions.map((t) =>
          t.id === action.id ? { ...t, status: "received", date: state.today } : t,
        ),
        changesToday: [...state.changesToday, { id: `chg-${action.id}`, label: `${tx.title} recibido`, delta: nio }],
      };
    }

    case "omit":
      // A future occurrence: it never touched the balance, so free money today is unchanged.
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.id
            ? { ...t, status: "omitted", note: "Omitida esta vez. La recurrencia continúa la próxima semana." }
            : t,
        ),
      };
  }
}

/* ───────────────────────── Context ───────────────────────── */

interface FinanceContextValue {
  state: FinanceState;
  snapshot: FinancialSnapshot;
  scenario: ScenarioId;
  isLoading: boolean;
  demo: DemoFlags;
  accountById: (id: string | undefined) => Account | undefined;
  setScenario: (id: ScenarioId) => void;
  setDemo: (patch: Partial<DemoFlags>) => void;
  addExpense: (input: MovementInput) => void;
  addIncome: (input: MovementInput) => void;
  addReserve: (input: ReserveInput) => void;
  transfer: (input: TransferInput) => void;
  markReceived: (id: string) => void;
  omitOccurrence: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

let counter = 0;
const newId = () => `local-${++counter}`;

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, DEFAULT_SCENARIO, buildScenario);
  const [scenario, setScenarioId] = useState<ScenarioId>(DEFAULT_SCENARIO);
  const [isLoading, setLoading] = useState(false);
  const [demo, setDemoState] = useState<DemoFlags>({ slowLoading: false, simulatorError: false });
  const loadTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(loadTimer.current), []);

  const setScenario = useCallback(
    (id: ScenarioId) => {
      setScenarioId(id);
      setLoading(true);
      clearTimeout(loadTimer.current);
      // Mimics a network round-trip so skeletons are exercised.
      loadTimer.current = setTimeout(
        () => {
          dispatch({ type: "load", state: buildScenario(id) });
          setLoading(false);
        },
        demo.slowLoading ? 1600 : 450,
      );
    },
    [demo.slowLoading],
  );

  const value = useMemo<FinanceContextValue>(() => {
    const snapshot = getSnapshot(state);
    return {
      state,
      snapshot,
      scenario,
      isLoading,
      demo,
      accountById: (id) => state.accounts.find((a) => a.id === id),
      setScenario,
      setDemo: (patch) => setDemoState((d) => ({ ...d, ...patch })),
      addExpense: (input) => dispatch({ type: "expense", id: newId(), input }),
      addIncome: (input) => dispatch({ type: "income", id: newId(), input }),
      addReserve: (input) => dispatch({ type: "reserve", id: newId(), input }),
      transfer: (input) => dispatch({ type: "transfer", id: newId(), input }),
      markReceived: (id) => dispatch({ type: "mark-received", id }),
      omitOccurrence: (id) => dispatch({ type: "omit", id }),
    };
  }, [state, scenario, isLoading, demo, setScenario]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error("useFinance must be used inside <FinanceProvider>");
  return ctx;
}
