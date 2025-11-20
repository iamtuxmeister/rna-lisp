# 🧬 RNA Lisp Interpreter

An esoteric programming language where biological RNA codons become code.

## Features

- **RNA-based syntax**: All operations are represented by biological codons
- **Multi-clause functions**: Erlang-style pattern matching
- **Immutable data structures**: Functional programming at its core
- **Interactive web interface**: Run code directly in your browser

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/rna-lisp-interpreter)

Or manually:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## Language Overview

### Basic Syntax

- **Numbers**: `CCU` = 0, `CCC` = 1, etc.
- **Variables**: `GGA` prefix (e.g., `GGACCU` = var#0)
- **Atoms**: `ACG` prefix (e.g., `ACGCCC` = :1)
- **Functions**: Defined with `AGA` (DEF)

### Example: Factorial

```rna
AUG AGA GGAACC
  AUG AUG CCU GUA CCC GUA
  AUG AUG GGACCU GUA AUG CUU GGACCU AUG GGAACC AUG GUC GGACCU GUA GUA GUA GUA
GUA

AUG CAU AUG GGAACC GCCACC GUA GUA
```

## Codon Reference

- **Arithmetic**: UUC (ADD), CUU (MUL), GUC (DEC)
- **Comparison**: AAA (EQU), UCU (LT), UCC (GT)
- **List**: UGU (CONS), GUU (CAR), AUU (CDR)
- **IO**: CAU (PRINT), AUC (READ)

## License

MIT
