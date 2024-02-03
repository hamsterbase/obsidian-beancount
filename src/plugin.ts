import { Plugin } from 'obsidian';

export interface IObsidianBeancountPlugin extends Plugin {
  readonly settings: IObsidianBeancountSettings;
  saveSettings(): Promise<void>;

  updateSetting(key: keyof IObsidianBeancountSettings, value: string): void;
}

export interface Transaction {
  file?: string;
  date?: string;
  amount?: string;
  currency?: string;
  from?: string;
  to?: string;
  payee?: string;
  description?: string;
}

export interface IObsidianBeancountSettings {
  main: string;
  lastTransaction?: Transaction;
}
