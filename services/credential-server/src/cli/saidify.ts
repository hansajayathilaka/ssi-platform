#!/usr/bin/env node

/**
 * SAID CLI Tool
 *
 * Command-line utility for computing SAIDs (Self-Addressing Identifiers)
 * for JSON schemas according to KERI specifications.
 *
 * Usage:
 *   saidify schema.json > schema.said.json
 *   saidify --input schema.json --output schema.said.json
 */

import * as fs from "fs";
import * as path from "path";
import { saidifyJsonString, SaidOptions } from "../utils/said.utils";
import { saidify } from "saidify";

interface CliOptions {
  input?: string;
  output?: string;
  label?: string;
  help?: boolean;
  version?: boolean;
}

function showHelp(): void {
  console.log(`
SAID CLI Tool - Compute Self-Addressing Identifiers for JSON Schemas

Usage:
  saidify [options] [input-file]
  saidify schema.json > schema.said.json

Options:
  -i, --input <file>      Input JSON schema file (default: stdin)
  -o, --output <file>     Output file (default: stdout)
  -l, --label <label>     Field label for SAID (default: $id)
  -h, --help             Show this help message
  -v, --version          Show version information

Examples:
  saidify schema.json                           # Output to stdout
  saidify -i schema.json -o schema.said.json    # Specify input/output files
  saidify --label d schema.json                 # Use 'd' field for SAID

The tool reads a JSON schema with a placeholder $id field and computes
the SAID (Self-Addressing Identifier) to fill the $id field.
`);
}

function showVersion(): void {
  const packageJson = require("../../package.json");
  console.log(`saidify v${packageJson.version}`);
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        options.help = true;
        break;
      case "-v":
      case "--version":
        options.version = true;
        break;
      case "-i":
      case "--input":
        options.input = args[++i];
        break;
      case "-o":
      case "--output":
        options.output = args[++i];
        break;
      case "-l":
      case "--label":
        options.label = args[++i];
        break;
      default:
        if (!arg.startsWith("-") && !options.input) {
          options.input = arg;
        }
        break;
    }
  }

  return options;
}

async function readInput(inputFile?: string): Promise<string> {
  if (inputFile) {
    if (!fs.existsSync(inputFile)) {
      throw new Error(`Input file '${inputFile}' does not exist`);
    }
    return fs.readFileSync(inputFile, "utf8");
  } else {
    // Read from stdin
    return new Promise((resolve, reject) => {
      let data = "";
      process.stdin.setEncoding("utf8");

      process.stdin.on("data", (chunk) => {
        data += chunk;
      });

      process.stdin.on("end", () => {
        resolve(data);
      });

      process.stdin.on("error", reject);
    });
  }
}

function writeOutput(output: string, outputFile?: string): void {
  if (outputFile) {
    fs.writeFileSync(outputFile, output, "utf8");
    console.error(`SAID computed and written to ${outputFile}`);
  } else {
    process.stdout.write(output);
  }
}

async function main(): Promise<void> {
  try {
    const args = process.argv.slice(2);
    const options = parseArgs(args);

    if (options.help) {
      showHelp();
      return;
    }

    if (options.version) {
      showVersion();
      return;
    }

    // Read input
    const inputJson = await readInput(options.input);

    if (!inputJson.trim()) {
      console.error("Error: No input provided");
      process.exit(1);
    }

    // Validate JSON
    try {
      JSON.parse(inputJson);
    } catch (error) {
      console.error("Error: Invalid JSON input");
      process.exit(1);
    }

    // Compute SAID using saidify library
    const inputData = JSON.parse(inputJson);
    const label = options.label || "$id";

    // Ensure the label field exists and is empty for saidification
    const dataForSaid = { ...inputData, [label]: "" };

    const [said, sad] = saidify(dataForSaid, label);

    const saidifiedJson = JSON.stringify(sad, null, 2);

    // Write output
    writeOutput(saidifiedJson, options.output);
  } catch (error) {
    console.error(
      `Error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error(
      `Fatal error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  });
}

export { main as saidifyCli };
