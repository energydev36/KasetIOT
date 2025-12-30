import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';

// Bridge existing Next.js eslint config (next/core-web-vitals) into flat config format
const compat = new FlatCompat({
  baseDirectory: path.resolve('.'),
});

export default [
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  ...compat.extends('next/core-web-vitals'),
];
