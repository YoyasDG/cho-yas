import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { formatAlignmentDebug } from './alignment';
import { parseSong, type ParseSongOptions } from './parser';

interface CliConfig extends ParseSongOptions {
  inputPath?: string;
  outputPath?: string;
}

function deriveOutputPath(inputPath: string): string {
  const ext = extname(inputPath);
  if (!ext) {
    return `${inputPath}.cho`;
  }
  return inputPath.slice(0, -ext.length) + '.cho';
}

function parseArgs(argv: string[]): CliConfig {
  const config: CliConfig = { mode: 'musical' };
  const positionals: string[] = [];

  for (const arg of argv) {
    if (arg === '--strict') {
      config.mode = 'strict';
      continue;
    }

    if (arg === '--musical') {
      config.mode = 'musical';
      continue;
    }

    if (arg === '--debug-alignment') {
      config.debugLogger = (entry) => {
        console.error(formatAlignmentDebug(entry));
        console.error('');
      };
      continue;
    }

    positionals.push(arg);
  }

  [config.inputPath, config.outputPath] = positionals;
  return config;
}

async function main(): Promise<void> {
  const config = parseArgs(process.argv.slice(2));

  if (!config.inputPath) {
    console.error('Usage: node convert.js [--strict|--musical] [--debug-alignment] input.txt [output.cho]');
    process.exitCode = 1;
    return;
  }

  const inputPath = resolve(process.cwd(), config.inputPath);
  const outputPath = resolve(process.cwd(), config.outputPath ?? deriveOutputPath(config.inputPath));

  const input = await readFile(inputPath, 'utf8');
  const output = parseSong(input, config);
  await writeFile(outputPath, `${output}\n`, 'utf8');

  console.log(`Wrote ${outputPath}`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
