import { App, SuggestModal } from 'obsidian';

export interface Option {
  label: string;
  value: string;
}

export class OptionSuggestModal extends SuggestModal<Option> {
  constructor(
    app: App,
    private options: Option[],
    private onChoose: (option: Option) => void
  ) {
    super(app);
  }
  getSuggestions(query: string): Option[] {
    return this.options.filter((book) =>
      book.label.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(book: Option, el: HTMLElement) {
    el.createEl('div', { text: book.label });
  }

  onChooseSuggestion(book: Option, evt: MouseEvent | KeyboardEvent) {
    this.onChoose(book);
  }
}
