import { App, Modal, Notice, Setting, TextComponent } from 'obsidian';
import { ParseResult } from './parser/parse-bean-count-main';
import { Transaction } from './plugin';
import { OptionSuggestModal } from './suggest-modal';

export class TransactionModal extends Modal {
  constructor(
    app: App,
    private parseResult: ParseResult,
    private data: Transaction,
    private onSave: (data: Transaction) => Promise<void>
  ) {
    super(app);
  }

  onOpen() {
    let { contentEl } = this;
    contentEl.createEl('h1', { text: 'New transaction' });
    this.createE({
      name: 'Beancount File',
      key: 'file',
      values: this.parseResult.files,
      // transaction 要储存在哪里
      placeholder: 'Where to save the transaction',
    });
    this.registerText({
      name: 'Date',
      key: 'date',
      defaultValue: getCurrentData(),
    });
    this.registerText({
      name: 'Amount',
      key: 'amount',
    });
    this.createE({
      name: 'Currency',
      key: 'currency',
      values: this.parseResult.currency,
    });
    this.createE({
      name: 'From account',
      key: 'from',
      values: this.parseResult.accounts,
    });
    this.createE({
      name: 'To account',
      key: 'to',
      values: this.parseResult.accounts,
    });
    this.createE({
      name: 'Payee',
      key: 'payee',
      values: this.parseResult.payee,
    });
    this.registerText({
      name: 'Description',
      key: 'description',
    });
    new Setting(contentEl).addButton((btn) =>
      btn
        .setButtonText('Submit')
        .setCta()
        .onClick(() => {
          this.onSave(this.data)
            .then(() => {
              this.close();
            })
            .catch((err) => {
              new Notice(err.message);
            });
          this.close();
        })
    );
  }

  private createE(option: {
    name: string;
    key: string;
    placeholder?: string;
    values: string[];
  }) {
    let component: TextComponent;
    new Setting(this.contentEl)
      .setName(option.name)
      .addText((e) => {
        component = e;
        if (option.placeholder) {
          e.setPlaceholder(option.placeholder);
        }
        if (this.data[option.key]) {
          e.setValue(this.data[option.key]);
        }
        component.onChange((value) => {
          this.data[option.key] = value;
        });
      })
      .addExtraButton((e) => {
        e.setIcon('list');
        e.onClick(() => {
          new OptionSuggestModal(
            this.app,
            option.values.map((o) => ({
              label: o,
              value: o,
            })),
            (select) => {
              component.setValue(select.value);
              this.data[option.key] = select.value;
            }
          ).open();
        });
      });
  }

  private registerText(option: {
    name: string;
    placeholder?: string;
    key: string;
    defaultValue?: string;
  }) {
    new Setting(this.contentEl).setName(option.name).addText((e) => {
      if (option.placeholder) {
        e.setPlaceholder(option.placeholder);
      }
      if (this.data[option.key]) {
        e.setValue(this.data[option.key]);
      } else if (option.defaultValue) {
        e.setValue(option.defaultValue);
        this.data[option.key] = option.defaultValue;
      }
      e.onChange((value) => {
        this.data[option.key] = value;
      });
    });
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}

function getCurrentData() {
  let currentDate = new Date();

  let year = currentDate.getFullYear();

  let month = (currentDate.getMonth() + 1).toString().padStart(2, '0');

  let day = currentDate.getDate().toString().padStart(2, '0');

  let formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}
