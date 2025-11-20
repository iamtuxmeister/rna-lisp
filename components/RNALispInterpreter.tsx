'use client';

import React, { useState } from 'react';
import { Play, Book, AlertCircle, CheckCircle } from 'lucide-react';

const RNALispInterpreter = () => {
  const [code, setCode] = useState(`AUG AGA GGAACC
  AUG AUG CCU GUA CCC GUA
  AUG AUG GGACCU GUA AUG CUU GGACCU AUG GGAACC AUG GUC GGACCU GUA GUA GUA GUA
GUA

AUG CAU AUG GGAACC GCCACC GUA GUA`);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const CODONS: Record<string, string> = {
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
    CAA: 'LAMBDA', CAC: 'NIL',
    // IO
    CAU: 'PRINT', AUC: 'READ'
  };

  const tokenize = (input: string) => {
    const tokens: any[] = [];
    const chars = input.replace(/\s+/g, ' ').trim();
    
    let pos = 0;
    while (pos < chars.length) {
      if (chars[pos] === ' ') {
        pos++;
        continue;
      }
      
      // Check for special multi-char tokens
      if (chars.substr(pos, 3) === 'ACG' || chars.substr(pos, 3) === 'GGA') {
        const prefix = chars.substr(pos, 3);
        pos += 3;
        let numStr = '';
        while (pos < chars.length && chars[pos] !== ' ') {
          numStr += chars[pos];
          pos++;
        }
        tokens.push({ type: prefix === 'ACG' ? 'ATOM' : 'VAR', value: numStr });
        continue;
      }
      
      // Check for string literals
      if (chars.substr(pos, 3) === 'UAG') {
        pos += 3;
        let content = '';
        while (pos < chars.length && chars.substr(pos, 3) !== 'GAU') {
          if (chars[pos] === ' ') {
            pos++;
            continue;
          }
          let digitSeq = '';
          while (pos < chars.length && chars[pos] !== ' ' && chars.substr(pos, 3) !== 'GAU') {
            digitSeq += chars[pos];
            pos++;
          }
          if (digitSeq) {
            const codePoint = parseCodonNumber(digitSeq);
            content += String.fromCharCode(codePoint);
          }
        }
        pos += 3; // skip GAU
        tokens.push({ type: 'STRING', value: content });
        continue;
      }
      
      // Check for number literals (consecutive digit codons)
      let numStr = '';
      let startPos = pos;
      while (pos < chars.length && chars[pos] !== ' ') {
        const codon = chars.substr(pos, 3);
        if (CODONS[codon] && /^\d$/.test(CODONS[codon])) {
          numStr += CODONS[codon];
          pos += 3;
        } else {
          break;
        }
      }
      
      if (numStr) {
        tokens.push({ type: 'NUMBER', value: parseInt(numStr) });
        continue;
      }
      
      // Regular codon
      const codon = chars.substr(pos, 3);
      if (CODONS[codon]) {
        tokens.push({ type: CODONS[codon] });
        pos += 3;
      } else {
        throw new Error(`Unknown codon at position ${pos}: ${codon}`);
      }
    }
    
    return tokens;
  };

  const parseCodonNumber = (codonStr: string) => {
    let result = '';
    for (let i = 0; i < codonStr.length; i += 3) {
      const codon = codonStr.substr(i, 3);
      if (CODONS[codon] && /^\d$/.test(CODONS[codon])) {
        result += CODONS[codon];
      }
    }
    return parseInt(result);
  };

  const parse = (tokens: any[]) => {
    let pos = 0;
    
    const parseExpr = (): any => {
      if (pos >= tokens.length) throw new Error('Unexpected end of input');
      
      const token = tokens[pos];
      
      if (token.type === 'NUMBER') {
        pos++;
        return { type: 'number', value: token.value };
      }
      
      if (token.type === 'STRING') {
        pos++;
        return { type: 'string', value: token.value };
      }
      
      if (token.type === 'ATOM') {
        pos++;
        return { type: 'atom', value: token.value };
      }
      
      if (token.type === 'VAR') {
        pos++;
        return { type: 'var', name: token.value };
      }
      
      if (token.type === 'TRUE') {
        pos++;
        return { type: 'boolean', value: true };
      }
      
      if (token.type === 'FALSE') {
        pos++;
        return { type: 'boolean', value: false };
      }
      
      if (token.type === 'NIL') {
        pos++;
        return { type: 'nil' };
      }
      
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
      
      // Handle standalone operators as symbols
      if (['ADD', 'SUB', 'MUL', 'DIV', 'MOD', 'INC', 'DEC', 'EQU', 'LT', 'GT', 
           'LE', 'GE', 'LTE', 'NE', 'NOT', 'CAR', 'CDR', 'CONS', 'PRINT', 'READ', 'DEF'].includes(token.type)) {
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

  const evaluate = (ast: any[], env: Record<string, any> = {}) => {
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
            return args.reduce((acc: number, arg: any) => acc + evalExpr(arg, localEnv), 0);
          }
          if (op === 'SUB') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
            return vals[0] - vals[1];
          }
          if (op === 'MUL') {
            return args.reduce((acc: number, arg: any) => acc * evalExpr(arg, localEnv), 1);
          }
          if (op === 'DIV') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
            return Math.floor(vals[0] / vals[1]);
          }
          if (op === 'MOD') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
            return vals[0] % vals[1];
          }
          if (op === 'INC') {
            return evalExpr(args[0], localEnv) + 1;
          }
          if (op === 'DEC') {
            return evalExpr(args[0], localEnv) - 1;
          }
          
          // Comparison
          if (op === 'EQU') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
            return vals[0] === vals[1];
          }
          if (op === 'LT') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
            return vals[0] < vals[1];
          }
          if (op === 'GT') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
            return vals[0] > vals[1];
          }
          if (op === 'LE' || op === 'LTE') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
            return vals[0] <= vals[1];
          }
          if (op === 'GE') {
            const vals = args.map((a: any) => evalExpr(a, localEnv));
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

  const runCode = () => {
    try {
      setError('');
      setOutput('');
      const tokens = tokenize(code);
      const ast = parse(tokens);
      const result = evaluate(ast);
      setOutput(result || '(no output)');
    } catch (e: any) {
      setError(e.message);
    }
  };

  const examples = [
    {
      name: 'Factorial',
      code: `AUG AGA GGAACC
  AUG AUG CCU GUA CCC GUA
  AUG AUG GGACCU GUA AUG CUU GGACCU AUG GGAACC AUG GUC GGACCU GUA GUA GUA GUA
GUA

AUG CAU AUG GGAACC GCCACC GUA GUA`
    },
    {
      name: 'FizzBuzz Helper',
      code: `AUG AGA GGACCU
  AUG AUG GGACCC GUA AUG AAA AUG CUA GGACCC CUACCC GUA CCU GUA GUA
GUA

AUG CAU AUG GGACCU CCCGCC GUA GUA
AUG CAU AUG GGACCU CCCGCA GUA GUA`
    },
    {
      name: 'Simple Math',
      code: `AUG CAU AUG UUC GCCACC CUACCC GUA GUA
AUG CAU AUG CUU CUACCC GCCGCC GUA GUA`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white">
            <h1 className="text-4xl font-bold mb-2">🧬 RNA Lisp Interpreter</h1>
            <p className="text-green-100">Biological Computing: Where Codons Meet Code</p>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {examples.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => setCode(ex.code)}
                  className="p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-left transition-colors border-2 border-emerald-200 hover:border-emerald-400"
                >
                  <Book className="inline mr-2 text-emerald-600" size={18} />
                  <span className="font-semibold text-emerald-900">{ex.name}</span>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  RNA Code
                </label>
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-96 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                  placeholder="Enter RNA Lisp code..."
                />
                <button
                  onClick={runCode}
                  className="mt-4 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <Play size={20} />
                  Execute RNA Code
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Output
                </label>
                <div className="h-96 p-4 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-sm overflow-auto">
                  {error ? (
                    <div className="text-red-600 flex items-start gap-2">
                      <AlertCircle size={20} className="flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-semibold">Error:</div>
                        <div>{error}</div>
                      </div>
                    </div>
                  ) : output ? (
                    <div className="text-green-800 flex items-start gap-2">
                      <CheckCircle size={20} className="flex-shrink-0 mt-1" />
                      <pre className="whitespace-pre-wrap">{output}</pre>
                    </div>
                  ) : (
                    <div className="text-gray-400">Output will appear here...</div>
                  )}
                </div>

                <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm overflow-auto max-h-96">
                  <h3 className="font-semibold text-blue-900 mb-3 text-base">Codon Reference Guide</h3>
                  <div className="text-blue-800 space-y-3 text-xs">
                    
                    <div>
                      <div className="font-semibold text-blue-900 mb-1">Arithmetic</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><code className="bg-blue-100 px-1 rounded">UUC</code> = ADD</div>
                        <div><code className="bg-blue-100 px-1 rounded">UUG</code> = SUB</div>
                        <div><code className="bg-blue-100 px-1 rounded">CUU</code> = MUL</div>
                        <div><code className="bg-blue-100 px-1 rounded">CUC</code> = DIV</div>
                        <div><code className="bg-blue-100 px-1 rounded">CUA</code> = MOD</div>
                        <div><code className="bg-blue-100 px-1 rounded">CUG</code> = INC</div>
                        <div><code className="bg-blue-100 px-1 rounded">GUC</code> = DEC</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-blue-900 mb-1">Comparison</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><code className="bg-blue-100 px-1 rounded">AAA</code> = EQU (=)</div>
                        <div><code className="bg-blue-100 px-1 rounded">UAU</code> = NE (≠)</div>
                        <div><code className="bg-blue-100 px-1 rounded">UCC</code> = GT (&gt;)</div>
                        <div><code className="bg-blue-100 px-1 rounded">UCU</code> = LT (&lt;)</div>
                        <div><code className="bg-blue-100 px-1 rounded">CAC</code> = GE (≥)</div>
                        <div><code className="bg-blue-100 px-1 rounded">GUG</code> = LE (≤)</div>
                        <div><code className="bg-blue-100 px-1 rounded">UCA</code> = LTE (≤)</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-blue-900 mb-1">Boolean</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><code className="bg-blue-100 px-1 rounded">AAU</code> = TRUE</div>
                        <div><code className="bg-blue-100 px-1 rounded">UUA</code> = FALSE</div>
                        <div><code className="bg-blue-100 px-1 rounded">UUU</code> = NOT</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-blue-900 mb-1">List Operations</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><code className="bg-blue-100 px-1 rounded">UGU</code> = CONS</div>
                        <div><code className="bg-blue-100 px-1 rounded">GUU</code> = CAR</div>
                        <div><code className="bg-blue-100 px-1 rounded">AUU</code> = CDR</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-blue-900 mb-1">Digits (0-9)</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><code className="bg-blue-100 px-1 rounded">CCU</code> = 0</div>
                        <div><code className="bg-blue-100 px-1 rounded">CCC</code> = 1</div>
                        <div><code className="bg-blue-100 px-1 rounded">CCA</code> = 2</div>
                        <div><code className="bg-blue-100 px-1 rounded">CCG</code> = 3</div>
                        <div><code className="bg-blue-100 px-1 rounded">GCU</code> = 4</div>
                        <div><code className="bg-blue-100 px-1 rounded">GCC</code> = 5</div>
                        <div><code className="bg-blue-100 px-1 rounded">GCA</code> = 6</div>
                        <div><code className="bg-blue-100 px-1 rounded">GCG</code> = 7</div>
                        <div><code className="bg-blue-100 px-1 rounded">ACU</code> = 8</div>
                        <div><code className="bg-blue-100 px-1 rounded">ACC</code> = 9</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-blue-900 mb-1">Structural</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><code className="bg-blue-100 px-1 rounded">AUG</code> = (</div>
                        <div><code className="bg-blue-100 px-1 rounded">GUA</code> = )</div>
                        <div><code className="bg-blue-100 px-1 rounded">AGA</code> = DEF</div>
                        <div><code className="bg-blue-100 px-1 rounded">CAA</code> = LAMBDA</div>
                        <div><code className="bg-blue-100 px-1 rounded">ACG</code> = Atom prefix</div>
                        <div><code className="bg-blue-100 px-1 rounded">GGA</code> = Variable prefix</div>
                        <div><code className="bg-blue-100 px-1 rounded">UAG</code> = &lt;&lt; (string start)</div>
                        <div><code className="bg-blue-100 px-1 rounded">GAU</code> = &gt;&gt; (string end)</div>
                        <div><code className="bg-blue-100 px-1 rounded">CAC</code> = NIL</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-semibold text-blue-900 mb-1">System/IO</div>
                      <div className="grid grid-cols-2 gap-1">
                        <div><code className="bg-blue-100 px-1 rounded">CAU</code> = PRINT</div>
                        <div><code className="bg-blue-100 px-1 rounded">AUC</code> = READ</div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RNALispInterpreter;
