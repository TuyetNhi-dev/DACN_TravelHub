"use client";

import { useState } from "react";
import { moveItem } from "@/lib/admin-forms";

export interface Keyed<T> {
  key: number;
  value: T;
}

interface ListState<T> {
  rows: Keyed<T>[];
  /** Next unused key; kept in state so keys never repeat after rows are removed. */
  next: number;
}

function keyed<T>(values: T[], from: number): ListState<T> {
  return { rows: values.map((value, i) => ({ key: from + i, value })), next: from + values.length };
}

/**
 * An editable list with stable React keys, so typing in a row keeps focus after another row is added, removed
 * or moved. `reset` replaces everything, e.g. with what the server saved.
 */
export function useListEditor<T>(initial: T[]) {
  const [state, setState] = useState<ListState<T>>(() => keyed(initial, 0));
  const setRows = (change: (rows: Keyed<T>[]) => Keyed<T>[]) =>
    setState(current => ({ ...current, rows: change(current.rows) }));

  return {
    rows: state.rows,
    values: state.rows.map(row => row.value),
    add: (value: T) => setState(current => ({
      rows: [...current.rows, { key: current.next, value }], next: current.next + 1,
    })),
    remove: (index: number) => setRows(rows => rows.filter((_, i) => i !== index)),
    move: (from: number, to: number) => setRows(rows => moveItem(rows, from, to)),
    update: (index: number, patch: Partial<T>) => setRows(rows =>
      rows.map((row, i) => (i === index ? { ...row, value: { ...row.value, ...patch } } : row))),
    reset: (values: T[]) => setState(current => keyed(values, current.next)),
  };
}
