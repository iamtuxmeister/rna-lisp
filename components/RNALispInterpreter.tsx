'use client';

import React, { useState } from 'react';
import { Play, Book, AlertCircle, CheckCircle } from 'lucide-react';
import { run } from '@/lib/rna-lisp';

const RNALispInterpreter = () => {
  const [code, setCode] = useState(`AUG AGA GGAACC
  AUG AUG CCU GUA CCC GUA
  AUG AUG GGACCU GUA AUG CUU GGACCU AUG GGAACC AUG GUC GGACCU GUA GUA GUA GUA
GUA

AUG CAU AUG GGAACC GCCACC GUA GUA`);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const runCode = () => {
    try {
      setError('');
      setOutput('');
      const result = run(code);
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
  AUG AUG GGACCC GUA AUG AAA AUG CUA GGACCC GCC GUA CCU GUA GUA
GUA

AUG CAU AUG GGACCU CCCGCC GUA GUA
AUG CAU AUG GGACCU CCCGCA GUA GUA`
    },
    {
      name: 'Simple Math',
      code: `AUG CAU AUG UUC GCCACC CCGCCC GUA GUA
AUG CAU AUG CUU CCGCCC GCCGCC GUA GUA`
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
                        <div><code className="bg-blue-100 px-1 rounded">GAC</code> = NIL</div>
                        <div><code className="bg-blue-100 px-1 rounded">UAA</code> = STOP (ends a number/atom/var literal)</div>
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
