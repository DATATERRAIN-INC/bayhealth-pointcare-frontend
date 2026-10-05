"use client";

import type { ReactNode } from "react";
import { ActionsMenu, type ActionsMenuItem } from "@/components/shared/ActionsMenu";

export type { ActionsMenuItem };

export interface RecordActionsProps {
  name: string;
  items: ActionsMenuItem[];
  menuWidth?: number;
  children?: ReactNode;
}

/** Thin wrapper: ActionsMenu plus optional dialog children for the row. */
export function RecordActions({ name, items, menuWidth, children }: RecordActionsProps) {
  return (
    <>
      <ActionsMenu name={name} items={items} menuWidth={menuWidth} />
      {children}
    </>
  );
}
