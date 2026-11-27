// Turkey Run — the entry's hand-in program (Node 22, standard library
// only). It copies game/ and screenshots/ from this repository to the
// output directory and writes /output/dossier.json with buildDossier from
// the vendored make.fun library. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output. Both runs write the same bytes.

import { cpSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function handIn() {
  // Clear only the CONTENTS of the output directory, never the directory
  // itself: the grader mounts /output writable but the filesystem above it
  // is read-only, so rmSync(outputDir) throws EACCES for the unprivileged
  // grader user (65534) and the run exits 1. Deleting the entries inside
  // /output works, and a stale file from an earlier run can still never
  // leak into this entry.
  try {
    for (const entry of readdirSync(outputDir)) {
      rmSync(join(outputDir, entry), { recursive: true, force: true });
    }
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
  mkdirSync(outputDir, { recursive: true });
  cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
  return dossier.length;
}

const dossierBytes = handIn();
console.log(`turkey-run-game-01: wrote ${outputDir} (dossier.json ${dossierBytes} bytes)`);