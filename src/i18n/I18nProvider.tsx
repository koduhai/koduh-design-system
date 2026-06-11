import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { defaultMessages, mergeMessages } from './messages';
import type { Messages, PartialMessages } from './messages';

interface I18nContextValue {
  messages: Messages;
  locale: string | undefined;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface KoduhI18nProviderProps {
  children: ReactNode;
  /**
   * Overrides for built-in UI strings, deep-merged over the English defaults.
   * Supply any subset; unset strings keep their default. Per-component string
   * props still win over this.
   */
  messages?: PartialMessages;
  /**
   * BCP-47 locale (e.g. `'fr-FR'`) used for `Intl` date/number formatting in
   * components that format values (Calendar, DatePicker). Defaults to the
   * runtime locale when unset.
   */
  locale?: string;
}

/**
 * Supplies localized built-in strings and a formatting locale to the component
 * tree. Optional: components fall back to English defaults when no provider is
 * present, so this is only needed to translate or to pin a locale.
 */
export function KoduhI18nProvider({ children, messages, locale }: KoduhI18nProviderProps) {
  const value = useMemo<I18nContextValue>(
    () => ({
      messages: messages ? mergeMessages(defaultMessages, messages) : defaultMessages,
      locale,
    }),
    [messages, locale],
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * The merged message catalog from the nearest {@link KoduhI18nProvider}, or the
 * English defaults when there is none. Always returns a complete catalog.
 */
export function useMessages(): Messages {
  return useContext(I18nContext)?.messages ?? defaultMessages;
}

/**
 * The configured `Intl` locale, or `undefined` to use the runtime default. Pass
 * straight to `Intl.DateTimeFormat` / `Intl.NumberFormat`.
 */
export function useLocale(): string | undefined {
  return useContext(I18nContext)?.locale;
}
