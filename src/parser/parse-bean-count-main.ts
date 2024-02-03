import { dirname, join } from './path';

export interface ParseResult {
  files: string[];
  currency: string[];
  accounts: string[];
  payee: string[];
}

interface ParseCtx {
  readFile(relativeName: string): Promise<string | null>;
  files: Set<string>;
  currency: Set<string>;
  accounts: Set<string>;
  payee: Set<string>;
}

export async function parseBeancountMain(
  currentName: string,
  readFile: (name: string) => Promise<string | null>
): Promise<ParseResult> {
  const fileContent = await readFile(currentName);
  if (!fileContent) {
    throw new Error('Main file not found');
  }
  const parseCtx: ParseCtx = {
    readFile: readFile,
    files: new Set(),
    currency: new Set(),
    accounts: new Set(),
    payee: new Set(),
  };
  await doParseWithCache(parseCtx, currentName);
  return {
    files: Array.from(parseCtx.files).sort(),
    currency: Array.from(parseCtx.currency).sort(),
    accounts: Array.from(parseCtx.accounts).sort(),
    payee: Array.from(parseCtx.payee).sort(),
  };
}

async function doParseWithCache(ctx: ParseCtx, currentName: string) {
  if (ctx.files.has(currentName)) {
    return;
  }
  ctx.files.add(currentName);
  const content = await ctx.readFile(currentName);
  if (!content) {
    return;
  }
  const lines = content.split('\n');

  const rules = [
    {
      regex: /include\s+"([^"]+)"/,
      handler: (match: RegExpMatchArray) => {
        return doParseWithCache(ctx, getName(currentName, match[1]));
      },
    },

    {
      regex: /commodity\s+(\S+)\s*;?/,
      handler: (match: RegExpMatchArray) => {
        ctx.currency.add(match[1]);
      },
    },
    {
      regex: /"operating_currency"\s+"(\w+)"/,
      handler: (match: RegExpMatchArray) => {
        ctx.currency.add(match[1]);
      },
    },

    {
      regex: /open\s+([^\s]+)[\s;]*/,
      handler: (match: RegExpMatchArray) => {
        ctx.accounts.add(match[1]);
      },
    },
    {
      regex: /^\d{4}-\d{2}-\d{2}\s+[*!]\s"(.*)"\s*".*".*$/,
      handler: (match: RegExpMatchArray) => {
        ctx.payee.add(match[1]);
      },
    },
  ];

  for (const line of lines) {
    for (const rule of rules) {
      if (rule.regex.test(line)) {
        await rule.handler(line.match(rule.regex)!);
      }
    }
  }
}

export function getName(base: string, include: string) {
  return join(dirname(base), include);
}
