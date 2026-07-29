// Core RNA-Lisp interpreter: tokenizer, parser, evaluator.
// Framework-free so it can run in the browser UI or a plain Node CLI.

export const CODONS: Record<string, string> = {
  // Arithmetic
  UUC: 'ADD', GUC: 'DEC', CUC: 'DIV', CUG: 'INC',
  CUA: 'MOD', CUU: 'MUL', UUG: 'SUB',
  // Boolean
  UUA: 'FALSE', UUU: 'NOT', AAU: 'TRUE',
  // Comparison
  AAA: 'EQU', CAC: 'GE', UCC: 'GT', GUG: 'LE',
  UCU: 'LT', UCA: 'LTE', UAU: 'NE',
  // List
  GUU: 'CAR', AUU: 'CDR', UGU: 'CONS',
  // Digits
  CCU: '0', CCC: '1', CCA: '2', CCG: '3',
  GCU: '4', GCC: '5', GCA: '6', GCG: '7',
  ACU: '8', ACC: '9',
  // Structural
  ACG: 'ATOM', GGA: 'VAR', AUG: 'LPAREN', GUA: 'RPAREN',
  UAG: 'LSTRING', GAU: 'RSTRING', AGA: 'DEF',
  CAA: 'LAMBDA', GAC: 'NIL', UAA: 'STOP',
  // IO
  CAU: 'PRINT', AUC: 'READ',
};

const DIGIT_CODONS = new Set(
  Object.keys(CODONS).filter((codon) => /^\d$/.test(CODONS[codon]))
);

const STANDALONE_SYMBOLS = [
  'ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'INC', 'DEC', 'EQU', 'LT', 'GT',
  'LE', 'GE', 'LTE', 'NE', 'NOT', 'CAR', 'CDR', 'CONS', 'PRINT', 'READ', 'DEF',
];

export type Token =
  | { type: 'NUMBER'; value: number }
  | { type: 'STRING'; value: string }
  | { type: 'ATOM'; value: string }
  | { type: 'VAR'; value: string }
  | { type: string };

// UAA is one of the three real stop codons in biological RNA (the others,
// UAG and UGA, are already spoken for as LSTRING and would collide). Here it
// plays the same role it plays in a ribosome: it terminates the sequence
// that came before it. A NUMBER, VAR, or ATOM literal is a run of
// variable-length digit-codons with no inherent end marker, so two of them
// placed back to back are lexically indistinguishable from one longer
// literal (`59` next to `10` reads as `5910`). An explicit STOP right after
// the literal removes that ambiguity without needing whitespace at all -
// which is what makes a truly space-free, continuous codon stream possible.
const STOP_CODON = 'UAA';

// Reads a run of consecutive digit-codons starting at `pos` and returns the
// decoded digit string plus the position just past the run (past a trailing
// STOP codon too, if one is present). The run stops at the first non-digit
// codon or whitespace; whitespace is never required, but if it's there, it
// still counts as a hard boundary, same as an explicit STOP.
const readDigitRun = (chars: string, pos: number): { digits: string; end: number } => {
  let digits = '';
  while (pos < chars.length && !/\s/.test(chars[pos])) {
    const codon = chars.substr(pos, 3);
    if (codon.length === 3 && DIGIT_CODONS.has(codon)) {
      digits += CODONS[codon];
      pos += 3;
    } else {
      break;
    }
  }
  if (chars.substr(pos, 3) === STOP_CODON) {
    pos += 3;
  }
  return { digits, end: pos };
};

export const tokenize = (input: string): Token[] => {
  const tokens: Token[] = [];
  const chars = input;

  let pos = 0;
  while (pos < chars.length) {
    if (/\s/.test(chars[pos])) {
      pos++;
      continue;
    }

    if (chars.length - pos < 3) {
      throw new Error(`Incomplete codon at position ${pos}: "${chars.slice(pos)}"`);
    }

    const codon = chars.substr(pos, 3);

    // ATOM / VAR: prefix codon followed by a self-delimiting run of
    // digit-codons (same rule as NUMBER below), so no separator is needed
    // before whatever comes next.
    if (codon === 'ACG' || codon === 'GGA') {
      const { digits, end } = readDigitRun(chars, pos + 3);
      if (!digits) {
        throw new Error(`${CODONS[codon]} prefix at position ${pos} must be followed by at least one digit codon`);
      }
      tokens.push({ type: codon === 'ACG' ? 'ATOM' : 'VAR', value: digits });
      pos = end;
      continue;
    }

    // STRING: UAG ... GAU. Each character is encoded as exactly three
    // digit-codons (a fixed-width "triplet of triplets"), so consecutive
    // characters never need a separator - we always know exactly where one
    // character's encoding ends and the next begins.
    if (codon === 'UAG') {
      pos += 3;
      let content = '';
      const skipWs = () => { while (pos < chars.length && /\s/.test(chars[pos])) pos++; };
      skipWs();
      while (pos < chars.length && chars.substr(pos, 3) !== 'GAU') {
        let digits = '';
        for (let i = 0; i < 3; i++) {
          skipWs();
          const digitCodon = chars.substr(pos, 3);
          if (!DIGIT_CODONS.has(digitCodon)) {
            throw new Error(`Invalid string character encoding at position ${pos}: expected a digit codon, got "${digitCodon}"`);
          }
          digits += CODONS[digitCodon];
          pos += 3;
        }
        content += String.fromCharCode(parseInt(digits, 10));
        skipWs();
      }
      if (chars.substr(pos, 3) !== 'GAU') {
        throw new Error('Unclosed string literal');
      }
      pos += 3; // skip GAU
      tokens.push({ type: 'STRING', value: content });
      continue;
    }

    // NUMBER: a bare run of digit-codons not preceded by ACG/GGA.
    if (DIGIT_CODONS.has(codon)) {
      const { digits, end } = readDigitRun(chars, pos);
      tokens.push({ type: 'NUMBER', value: parseInt(digits, 10) });
      pos = end;
      continue;
    }

    // Regular fixed-width codon.
    if (CODONS[codon]) {
      tokens.push({ type: CODONS[codon] });
      pos += 3;
      continue;
    }

    throw new Error(`Unknown codon at position ${pos}: ${codon}`);
  }

  return tokens;
};

export const parse = (tokens: Token[]): any[] => {
  let pos = 0;

  const parseExpr = (): any => {
    if (pos >= tokens.length) throw new Error('Unexpected end of input');

    const token = tokens[pos];

    if (token.type === 'NUMBER') { pos++; return { type: 'number', value: (token as any).value }; }
    if (token.type === 'STRING') { pos++; return { type: 'string', value: (token as any).value }; }
    if (token.type === 'ATOM') { pos++; return { type: 'atom', value: (token as any).value }; }
    if (token.type === 'VAR') { pos++; return { type: 'var', name: (token as any).value }; }
    if (token.type === 'TRUE') { pos++; return { type: 'boolean', value: true }; }
    if (token.type === 'FALSE') { pos++; return { type: 'boolean', value: false }; }
    if (token.type === 'NIL') { pos++; return { type: 'nil' }; }

    if (token.type === 'LPAREN') {
      pos++;
      const expr = [];
      while (pos < tokens.length && tokens[pos].type !== 'RPAREN') {
        expr.push(parseExpr());
      }
      if (pos >= tokens.length) throw new Error('Unclosed parenthesis');
      pos++; // skip RPAREN
      return { type: 'list', items: expr };
    }

    if (STANDALONE_SYMBOLS.includes(token.type)) {
      pos++;
      return { type: 'symbol', name: token.type };
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  };

  const result = [];
  while (pos < tokens.length) {
    result.push(parseExpr());
  }
  return result;
};

const describe = (val: any): string => {
  if (val === null) return 'nil';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return `number ${val}`;
  if (typeof val === 'string') return `string "${val}"`;
  if (val?.symbol) return `operator ${val.symbol}`;
  if (val?.atom) return `atom :${val.atom}`;
  if (val?.cons) return 'cons pair';
  if (val?.type === 'function') return 'function';
  return JSON.stringify(val);
};

const asNumber = (val: any, op: string): number => {
  if (typeof val !== 'number') {
    throw new Error(`${op} expected a number but got ${describe(val)}`);
  }
  return val;
};

export const evaluate = (ast: any[], env: Record<string, any> = {}): string => {
  const outputs: string[] = [];

  const evalExpr = (expr: any, localEnv: Record<string, any>): any => {
    if (!expr) return null;

    if (expr.type === 'number') return expr.value;
    if (expr.type === 'string') return expr.value;
    if (expr.type === 'boolean') return expr.value;
    if (expr.type === 'nil') return null;
    if (expr.type === 'atom') return { atom: expr.value };
    if (expr.type === 'symbol') return { symbol: expr.name };

    if (expr.type === 'var') {
      if (!(expr.name in localEnv)) {
        throw new Error(`Undefined variable: ${expr.name}`);
      }
      return localEnv[expr.name];
    }

    if (expr.type === 'list') {
      const items = expr.items;
      if (items.length === 0) return null;

      const [first, ...args] = items;

      // DEF - define function
      if (first.type === 'symbol' && first.name === 'DEF') {
        const [varNode, ...clauses] = args;
        if (varNode.type !== 'var') throw new Error('DEF requires variable name');

        const parsedClauses = clauses.map((clause: any) => {
          if (clause.type !== 'list' || clause.items.length !== 2) {
            throw new Error('Each clause must be ((pattern) body)');
          }
          const [patternList, body] = clause.items;
          if (patternList.type !== 'list' || patternList.items.length === 0) {
            throw new Error('Pattern must be a list');
          }
          return { pattern: patternList.items[0], body };
        });

        localEnv[varNode.name] = { type: 'function', clauses: parsedClauses, env: localEnv };
        return null;
      }

      // Evaluate first element to get the operator/function
      const firstVal = evalExpr(first, localEnv);

      // Handle operators
      if (firstVal?.symbol) {
        const op = firstVal.symbol;

        // Arithmetic operations
        if (op === 'ADD') {
          return args.reduce((acc: number, arg: any) => acc + asNumber(evalExpr(arg, localEnv), 'ADD'), 0);
        }
        if (op === 'SUB') {
          const vals = args.map((a: any) => asNumber(evalExpr(a, localEnv), 'SUB'));
          return vals[0] - vals[1];
        }
        if (op === 'MUL') {
          return args.reduce((acc: number, arg: any) => acc * asNumber(evalExpr(arg, localEnv), 'MUL'), 1);
        }
        if (op === 'DIV') {
          const vals = args.map((a: any) => asNumber(evalExpr(a, localEnv), 'DIV'));
          return Math.floor(vals[0] / vals[1]);
        }
        if (op === 'MOD') {
          const vals = args.map((a: any) => asNumber(evalExpr(a, localEnv), 'MOD'));
          return vals[0] % vals[1];
        }
        if (op === 'INC') {
          return asNumber(evalExpr(args[0], localEnv), 'INC') + 1;
        }
        if (op === 'DEC') {
          return asNumber(evalExpr(args[0], localEnv), 'DEC') - 1;
        }

        // Comparison
        if (op === 'EQU') {
          const vals = args.map((a: any) => evalExpr(a, localEnv));
          return vals[0] === vals[1];
        }
        if (op === 'LT') {
          const vals = args.map((a: any) => asNumber(evalExpr(a, localEnv), 'LT'));
          return vals[0] < vals[1];
        }
        if (op === 'GT') {
          const vals = args.map((a: any) => asNumber(evalExpr(a, localEnv), 'GT'));
          return vals[0] > vals[1];
        }
        if (op === 'LE' || op === 'LTE') {
          const vals = args.map((a: any) => asNumber(evalExpr(a, localEnv), op));
          return vals[0] <= vals[1];
        }
        if (op === 'GE') {
          const vals = args.map((a: any) => asNumber(evalExpr(a, localEnv), 'GE'));
          return vals[0] >= vals[1];
        }
        if (op === 'NE') {
          const vals = args.map((a: any) => evalExpr(a, localEnv));
          return vals[0] !== vals[1];
        }

        // Boolean
        if (op === 'NOT') {
          return !evalExpr(args[0], localEnv);
        }

        // List operations
        if (op === 'CONS') {
          return { cons: [evalExpr(args[0], localEnv), evalExpr(args[1], localEnv)] };
        }
        if (op === 'CAR') {
          const list = evalExpr(args[0], localEnv);
          return list?.cons?.[0] ?? null;
        }
        if (op === 'CDR') {
          const list = evalExpr(args[0], localEnv);
          return list?.cons?.[1] ?? null;
        }

        // IO
        if (op === 'PRINT') {
          const val = evalExpr(args[0], localEnv);
          outputs.push(formatValue(val));
          return val;
        }
      }

      // Function call
      if (firstVal?.type === 'function') {
        const argVals = args.map((a: any) => evalExpr(a, localEnv));

        // Try each clause
        for (const clause of firstVal.clauses) {
          const newEnv = { ...firstVal.env };
          if (matchPattern(clause.pattern, argVals[0], newEnv)) {
            return evalExpr(clause.body, newEnv);
          }
        }

        throw new Error('No matching clause');
      }

      // Evaluate as list of expressions
      return items.map((e: any) => evalExpr(e, localEnv));
    }

    return expr;
  };

  const matchPattern = (pattern: any, value: any, env: Record<string, any>) => {
    if (pattern.type === 'number') {
      return pattern.value === value;
    }
    if (pattern.type === 'atom') {
      return pattern.value === value?.atom;
    }
    if (pattern.type === 'var') {
      env[pattern.name] = value;
      return true;
    }
    return false;
  };

  const formatValue = (val: any): string => {
    if (val === null) return 'nil';
    if (typeof val === 'boolean') return val ? 'true' : 'false';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'string') return `"${val}"`;
    if (val?.atom) return `:${val.atom}`;
    if (val?.cons) return `(${formatValue(val.cons[0])} . ${formatValue(val.cons[1])})`;
    return JSON.stringify(val);
  };

  for (const expr of ast) {
    evalExpr(expr, env);
  }

  return outputs.join('\n');
};

export const run = (code: string): string => {
  const tokens = tokenize(code);
  const ast = parse(tokens);
  return evaluate(ast);
};
