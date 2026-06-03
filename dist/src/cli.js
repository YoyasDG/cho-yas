"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const alignment_1 = require("./alignment");
const parser_1 = require("./parser");
function deriveOutputPath(inputPath) {
    const ext = (0, node_path_1.extname)(inputPath);
    if (!ext) {
        return `${inputPath}.cho`;
    }
    return inputPath.slice(0, -ext.length) + '.cho';
}
function parseArgs(argv) {
    const config = { mode: 'musical' };
    const positionals = [];
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
                console.error((0, alignment_1.formatAlignmentDebug)(entry));
                console.error('');
            };
            continue;
        }
        positionals.push(arg);
    }
    [config.inputPath, config.outputPath] = positionals;
    return config;
}
async function main() {
    const config = parseArgs(process.argv.slice(2));
    if (!config.inputPath) {
        console.error('Usage: node convert.js [--strict|--musical] [--debug-alignment] input.txt [output.cho]');
        process.exitCode = 1;
        return;
    }
    const inputPath = (0, node_path_1.resolve)(process.cwd(), config.inputPath);
    const outputPath = (0, node_path_1.resolve)(process.cwd(), config.outputPath ?? deriveOutputPath(config.inputPath));
    const input = await (0, promises_1.readFile)(inputPath, 'utf8');
    const output = (0, parser_1.parseSong)(input, config);
    await (0, promises_1.writeFile)(outputPath, `${output}\n`, 'utf8');
    console.log(`Wrote ${outputPath}`);
}
void main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
});
