import { Notice, Plugin, TFile } from 'obsidian';
import { parseBeancountMain } from './parser/parse-bean-count-main';
import {
  IObsidianBeancountPlugin,
  IObsidianBeancountSettings,
  Transaction,
} from './plugin';
import { ObsidianBeancountSettingsTab } from './setting';
import { TransactionModal } from './transaction-modal';

export class ObsidianBeancountPlugin
  extends Plugin
  implements IObsidianBeancountPlugin
{
  settings: IObsidianBeancountSettings = {
    main: 'main.bean',
  };

  async onload(): Promise<void> {
    await this.loadSettings();
    this.addSettingTab(new ObsidianBeancountSettingsTab(this.app, this));
    this.addRibbonIcon('wallet', 'Save transaction', async () => {
      try {
        const data = await parseBeancountMain(
          this.settings.main,
          this.readFile
        );
        new TransactionModal(this.app, data, {}, this.doSave).open();
      } catch (error) {
        new Notice('Error: ' + error);
      }
    });
  }

  private readFile = async (name: string) => {
    const file = this.app.vault.getAbstractFileByPath(name);
    if (file instanceof TFile) {
      return await this.app.vault.read(file);
    }
    return null;
  };

  private doSave = async (transaction: Transaction): Promise<void> => {
    const { file, date, amount, currency, from, to, payee, description } =
      transaction;

    if (!file) {
      throw new Error('File is required');
    }
    const fileToSave = this.app.vault.getAbstractFileByPath(file);

    if (!date) {
      throw new Error('Date is required');
    }
    if (!amount) {
      throw new Error('Amount is required');
    }
    if (isNaN(parseInt(amount, 10))) {
      throw new Error('Amount is not a number');
    }
    if (!currency) {
      throw new Error('Currency is required');
    }
    if (!from) {
      throw new Error('From account is required');
    }
    if (!to) {
      throw new Error('To account is required');
    }
    let message = `"${description}"`;
    if (payee) {
      message = `\b"${payee}" "${description}"`;
    }
    const res = `
    ${date} * ${message}          
      ${from} ${parseInt(amount, 10).toFixed(2)} ${currency}
      ${to} ${-parseInt(amount, 10).toFixed(2)} ${currency}
              `.trim();
    if (fileToSave instanceof TFile) {
      const old = await this.app.vault.read(fileToSave);
      await this.app.vault.modify(fileToSave, old + '\n' + res);
      await this.updateSetting('lastTransaction', transaction);
      new Notice('Transaction saved');
    } else {
      throw new Error(`File ${file} is not file type`);
    }
  };

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, this.settings, await super.loadData());
  }

  async updateSetting(key: keyof IObsidianBeancountSettings, value: any) {
    this.settings[key] = value;
    await this.saveSettings();
  }

  async saveSettings(): Promise<void> {
    await super.saveData(this.settings);
  }
}

export default ObsidianBeancountPlugin;
