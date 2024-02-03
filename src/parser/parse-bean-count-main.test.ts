import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { expect, it } from 'vitest';
import { parseBeancountMain } from './parse-bean-count-main';
import { join } from './path';

it('join', async () => {
  const fixtureRoot = resolve(__dirname, './fixures');
  const readFileFunc = async (name: string) => {
    try {
      const res = await readFile(join(fixtureRoot, name), 'utf-8');
      return res;
    } catch (error) {
      return null;
    }
  };

  expect(await parseBeancountMain('main.bean', readFileFunc))
    .toMatchInlineSnapshot(`
    {
      "accounts": [
        "Assets:Bank:Checking",
        "Assets:Cash",
        "Expenses:Coffee",
        "Expenses:Family:Software",
      ],
      "currency": [
        "CNY",
        "JPY",
        "USD",
      ],
      "files": [
        "coffee.bean",
        "main.bean",
      ],
      "payee": [
        "HamsterBase",
        "starbucks",
      ],
    }
  `);
});
