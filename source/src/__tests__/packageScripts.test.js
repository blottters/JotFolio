import { describe, expect, it, beforeAll } from 'vitest';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
// source/ is two levels up from src/__tests__/
const sourceRoot = path.resolve(here, '..', '..');
const pkgPath = path.join(sourceRoot, 'package.json');

let scripts;
beforeAll(() => {
  scripts = JSON.parse(readFileSync(pkgPath, 'utf8')).scripts;
});

function binExists(name) {
  // Resolved bin on Windows can be the .cmd shim or a plain script.
  const base = path.join(sourceRoot, 'node_modules', '.bin', name);
  return existsSync(base) || existsSync(base + '.cmd') || existsSync(base + '.ps1');
}

describe('package.json scripts', () => {
  it('defines "dev" running vite, and vite is installed', () => {
    expect(scripts.dev).toBeDefined();
    expect(scripts.dev).toMatch(/\bvite\b/);
    expect(binExists('vite')).toBe(true);
  });

  it('defines "build" running vite build, and vite is installed', () => {
    expect(scripts.build).toBeDefined();
    expect(scripts.build).toMatch(/\bvite\s+build\b/);
    expect(binExists('vite')).toBe(true);
  });

  it('defines "preview" running vite preview, and vite is installed', () => {
    expect(scripts.preview).toBeDefined();
    expect(scripts.preview).toMatch(/\bvite\s+preview\b/);
    expect(binExists('vite')).toBe(true);
  });

  it('defines "bench" running bench/runBench.js, and the script file exists', () => {
    expect(scripts.bench).toBeDefined();
    expect(scripts.bench).toMatch(/bench[\/\\]runBench\.js/);
    const runBench = path.join(sourceRoot, 'bench', 'runBench.js');
    expect(existsSync(runBench)).toBe(true);
    expect(statSync(runBench).isFile()).toBe(true);
  });

  it('defines "a11y" running playwright on bench/a11y/, with bench/a11y present and playwright installed', () => {
    expect(scripts.a11y).toBeDefined();
    expect(scripts.a11y).toMatch(/playwright\s+test\s+bench[\/\\]a11y/);
    const a11yDir = path.join(sourceRoot, 'bench', 'a11y');
    expect(existsSync(a11yDir)).toBe(true);
    expect(statSync(a11yDir).isDirectory()).toBe(true);
    expect(binExists('playwright')).toBe(true);
  });

  it('defines "electron:build" running vite build + electron-builder', () => {
    expect(scripts['electron:build']).toBeDefined();
    expect(scripts['electron:build']).toMatch(/electron-builder/);
    expect(binExists('electron-builder')).toBe(true);
  });

  it('defines "build:testing" running vite build + electron-builder --win with the testing config', () => {
    expect(scripts['build:testing']).toBeDefined();
    expect(scripts['build:testing']).toMatch(/vite\s+build/);
    expect(scripts['build:testing']).toMatch(/electron-builder/);
    expect(scripts['build:testing']).toMatch(/electron-builder\.testing\.yml/);
    const cfg = path.join(sourceRoot, 'electron-builder.testing.yml');
    expect(existsSync(cfg)).toBe(true);
  });
});
