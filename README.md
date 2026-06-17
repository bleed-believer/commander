# @bleed-believer/commander

A lightweight, TypeScript-first library for building type-safe CLI applications. Define your commands with a template string and get fully-inferred types for positional arguments and flags — no decorators, no reflection, no runtime magic.

## Installation

```bash
npm install @bleed-believer/commander
```

## Core concepts

The library has three layers, each building on the one below:

| Class | Role |
|---|---|
| `Argv` | Low-level parser: tokenizes `process.argv` against a typed schema. |
| `Command` | Wraps `Argv` with a lifecycle handler (`onInit` / `onDestroy`). |
| `CommandRouter` | Groups commands under an optional path prefix; supports nesting. |
| `Commander` | Top-level dispatcher: tries targets in order, re-throws errors. |

---

## `Argv` — argument parsing

`Argv` parses raw `process.argv` against a positionals template and a flags schema. Types are inferred from both at compile time.

```ts
import { Argv } from '@bleed-believer/commander';

const argv = new Argv({
    positionals: 'install(i) :packages*',
    flags: {
        saveDev: { type: 'boolean', short: 'D' },
        config:  { type: 'string',  short: 'c' }
    }
});

const result = argv.parse();
// result.positionals.packages  →  string[]
// result.flags.saveDev         →  boolean | undefined
// result.flags.config          →  string  | undefined
// result.tail                  →  string[]
```

### Positionals template syntax

The `positionals` string is a space-separated list of tokens, matched left-to-right against the arguments after `node` and the script path.

| Token | Meaning | TypeScript type |
|---|---|---|
| `literal` | Must match exactly (e.g. `run`) | — (no capture) |
| `name(alias)` | Matches the name **or** any alias (e.g. `install(i)`) | — (no capture) |
| `name(a,b,c)` | Matches the name or multiple aliases | — |
| `:name` | Required capture | `string` |
| `:name?` | Optional capture | `string \| undefined` |
| `:name*` | Variadic, zero-or-more; consumes all remaining positionals | `string[]` |
| `:name+` | Variadic, one-or-more; throws if empty | `[string, ...string[]]` |

**Examples:**

```ts
// Simple required capture
new Argv({ positionals: 'run :target' })
// argv: ['node', 'script', 'run', './src/index.ts']
// → positionals: { target: './src/index.ts' }

// Optional capture (may be absent)
new Argv({ positionals: 'run :target?' })
// argv: ['node', 'script', 'run']
// → positionals: { target: undefined }

// Variadic zero-or-more
new Argv({ positionals: 'install :packages*' })
// argv: ['node', 'script', 'install', 'a', 'b']
// → positionals: { packages: ['a', 'b'] }

// Alias: matches 'install' OR 'i'
new Argv({ positionals: 'install(i) :packages*' })
// argv: ['node', 'script', 'i', 'typescript']
// → positionals: { packages: ['typescript'] }
```

### Flag options

Flags are defined as a record of camelCase names to `FlagOptions`:

```ts
interface FlagOptions {
    type:      'string' | 'number' | 'boolean';
    short?:    string;   // single-character shorthand (e.g. 'D' → -D)
    array?:    boolean;  // accept multiple values for the same flag
    required?: boolean;  // narrows the inferred type to non-undefined
}
```

Flag names are automatically converted to `--kebab-case` on the CLI:

| camelCase name | CLI flag |
|---|---|
| `saveDev` | `--save-dev` |
| `outputDir` | `--output-dir` |

**Boolean flags** never consume the next token as their value — so `--save foo` with `save` declared as `boolean` leaves `foo` as a positional.

#### Flag input formats

```bash
# Long form with space
node script install --output-dir ./dist

# Long form with equals
node script install --output-dir=./dist

# Short form
node script install -o ./dist

# Boolean flag (no value needed)
node script install --save-dev
```

#### `--` tail separator

Everything after `--` is collected into `result.tail` and not parsed as flags:

```bash
node script run ./src/index.ts -- serve --port 8080
#                                 ↑ tail: ['serve', '--port', '8080']
```

#### Flag type inference

```ts
const argv = new Argv({
    positionals: 'build',
    flags: {
        watch:     { type: 'boolean', short: 'w' },
        port:      { type: 'number',  short: 'p', required: true },
        outDir:    { type: 'string' },
        include:   { type: 'string',  array: true }
    }
});

const { flags } = argv.parse();
flags.watch    // boolean | undefined
flags.port     // number              (required → non-optional)
flags.outDir   // string  | undefined
flags.include  // string[] | undefined
```

### Errors thrown by `Argv.parse()`

| Error class | When thrown |
|---|---|
| `StaticMismatchError` | A literal or alias token in the template did not match the input. |
| `PositionalMismatchError` | A required positional (`:name` or `:name+`) was not provided. |
| `FlagParseError` | A flag declared as `number` received a non-numeric value. |

---

## `Command` — lifecycle-based handler

`Command` wraps an `Argv` schema with a factory callback that returns a handler object (`CommandTarget`). Call `run()` to attempt a match and execute the handler.

```ts
import { Command } from '@bleed-believer/commander';
import type { CommandTarget } from '@bleed-believer/commander';

const installCommand = new Command({
    description: 'Install packages',
    positionals: 'install(i) :packages*',
    flags: {
        saveDev: { type: 'boolean', short: 'D', description: 'Install as dev dependency' }
    },
    callback: context => new class implements CommandTarget {
        async onInit() {
            const { packages } = context.positionals;
            const dev = context.flags.saveDev ?? false;
            console.log(`Installing ${packages.join(', ')} (dev=${dev})`);
        }
    }
});

const result = await installCommand.run();
```

### `CommandTarget` interface

```ts
interface CommandTarget {
    onInit():     void | Promise<void>;
    onDestroy?(): void | Promise<void>;
}
```

`onInit` is called first; `onDestroy` (optional) is called after `onInit` completes. Use `onDestroy` to close file handles, DB connections, or other resources.

### `CommandResult` return value

`run()` never throws. It returns a `CommandResult` object:

```ts
interface CommandResult {
    matches: boolean;
    error?:  Error;
}
```

| Result | Meaning |
|---|---|
| `{ matches: false }` | Static literal tokens didn't match — this is not the right command. |
| `{ matches: false, error }` | Literals matched but a required positional was missing. |
| `{ matches: true, error }` | Positionals matched but a flag had an invalid value or the handler threw. |
| `{ matches: true }` | Command matched and handler completed without error. |

### Inline object handler

Instead of `implements CommandTarget`, you can return a plain object:

```ts
const helpCommand = new Command({
    positionals: 'help(h)',
    callback: _ => ({
        onInit() {
            console.log('Usage: mycli <command> [options]');
        }
    })
});
```

### Testing a command in isolation

Pass a custom `argv` array to `run()` to avoid touching `process.argv`:

```ts
const result = await installCommand.run({
    argv: ['node', 'script', 'install', '--save-dev', 'typescript']
});
```

---

## `CommandRouter` — prefix-based routing

`CommandRouter` groups commands under an optional path prefix and tries them in declaration order. Routers can be nested to any depth.

```ts
import { CommandRouter } from '@bleed-believer/commander';

const router = new CommandRouter({
    path: 'pkg',
    targets: [installCommand, uninstallCommand]
});
```

### Path prefix

When `path` is set, those tokens are checked against the start of `argv` (after `node` and the script). If they match, the tokens are stripped before the targets are tried. If they don't match, `{ matches: false }` is returned immediately.

- Path tokens support the same `name(alias)` alias syntax as positionals.
- Multi-segment paths are space-separated: `'pkg scripts'`.

```ts
// Matches: node script pkg install react
// Strips 'pkg', then tries installCommand with: node script install react
new CommandRouter({
    path: 'pkg',
    targets: [installCommand]
})

// Matches: node script pkg scripts run build
// Strips 'pkg scripts', then tries runCommand with: node script run build
new CommandRouter({
    path: 'pkg scripts',
    targets: [runCommand]
})

// Path alias: matches 'pkg' OR 'p'
new CommandRouter({
    path: 'pkg(p)',
    targets: [installCommand]
})
```

### Nested routers

Both `Command` and `CommandRouter` satisfy the `CommandRouterTarget` interface, so they can be freely mixed in a `targets` list:

```ts
const root = new CommandRouter({
    targets: [
        new CommandRouter({
            path: 'pkg',
            targets: [
                new Command({ positionals: 'install(i) :packages*', callback: ... }),
                new Command({ positionals: 'uninstall(u) :packages*', callback: ... })
            ]
        }),
        new Command({ positionals: 'help(h)', callback: ... })
    ]
});

await root.run();
```

---

## `Commander` — top-level dispatcher

`Commander` is the entry point for a CLI application. It iterates targets in order and re-throws any error from the result.

```ts
import { Commander, Command, CommandRouter } from '@bleed-believer/commander';

const commander = new Commander([
    new CommandRouter({
        path: 'pkg',
        targets: [installCommand, uninstallCommand]
    }),
    helpCommand,
    versionCommand
]);

await commander.run();
```

Unlike `CommandRouter.run()`, `Commander.run()` **throws** when a target returns an error. The intent is to surface unhandled errors at the top of the call stack so the process can exit with a non-zero code.

### Testing with Commander

Inject a custom `process` to control argv without patching globals:

```ts
const commander = new Commander([myCommand], {
    process: { argv: ['node', 'script', 'install', 'react'] }
});

await commander.run();
```

---

## Complete example

```ts
import { Commander, Command, CommandRouter } from '@bleed-believer/commander';
import type { CommandTarget } from '@bleed-believer/commander';

// --- commands ---

const installCommand = new Command({
    description: 'Install one or more packages',
    positionals: 'install(i) :packages+',
    flags: {
        saveDev:  { type: 'boolean', short: 'D', description: 'Install as dev dependency' },
        registry: { type: 'string',  short: 'r', description: 'Custom npm registry URL' }
    },
    callback: context => new class implements CommandTarget {
        async onInit() {
            const { packages } = context.positionals;
            const { saveDev, registry } = context.flags;
            console.log(`Installing: ${packages.join(' ')}`);
            if (saveDev)   console.log('  → saved as devDependency');
            if (registry)  console.log(`  → using registry: ${registry}`);
        }
    }
});

const uninstallCommand = new Command({
    description: 'Remove one or more packages',
    positionals: 'uninstall(u,remove,rm) :packages+',
    callback: context => ({
        async onInit() {
            console.log(`Removing: ${context.positionals.packages.join(' ')}`);
        }
    })
});

const runCommand = new Command({
    description: 'Run a named script',
    positionals: 'run :script :args*',
    callback: context => ({
        onInit() {
            console.log(`Running script: ${context.positionals.script}`);
        }
    })
});

const helpCommand = new Command({
    description: 'Show help',
    positionals: 'help(h)',
    callback: _ => ({
        onInit() {
            console.log('Usage: mycli <group> <command> [options]');
        }
    })
});

// --- router tree ---

const pkgRouter = new CommandRouter({
    path: 'pkg(p)',
    targets: [installCommand, uninstallCommand]
});

const scriptsRouter = new CommandRouter({
    path: 'pkg scripts',
    targets: [runCommand]
});

// --- entry point ---

const commander = new Commander([
    scriptsRouter,  // more-specific prefix first
    pkgRouter,
    helpCommand
]);

try {
    await commander.run();
} catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
}
```

**Usage:**

```bash
node mycli.js pkg install react vue --save-dev
node mycli.js p i typescript -D
node mycli.js pkg uninstall lodash
node mycli.js pkg scripts run build
node mycli.js help
```

---

## API reference

### `Argv<P, F>`

| Member | Signature | Description |
|---|---|---|
| `constructor` | `(options: { positionals: P; flags?: F })` | Define the schema. |
| `parse` | `(processLike?: { argv: string[] }) → ParsedArgv<P, F>` | Parse and return typed result. Throws on mismatch. |

### `Command<P, F>`

| Member | Signature | Description |
|---|---|---|
| `constructor` | `(options: CommandOptions<P, F>)` | Define the command schema and handler factory. |
| `description` | `string \| undefined` | Human-readable summary (read-only). |
| `positionals` | `P` | Raw positionals template string (read-only). |
| `run` | `(processLike?: { argv: string[] }) → Promise<CommandResult>` | Match and execute; never throws. |

### `CommandRouter`

| Member | Signature | Description |
|---|---|---|
| `constructor` | `(options: CommandRouterOptions)` | Provide optional `path` and ordered `targets`. |
| `run` | `(processLike?: { argv: string[] }) → Promise<CommandResult>` | Match and dispatch; never throws. |

### `Commander`

| Member | Signature | Description |
|---|---|---|
| `constructor` | `(targets: CommanderTarget[], inject?: CommanderInject)` | Ordered list of commands/routers. |
| `run` | `() → Promise<void>` | Dispatch to targets; **re-throws** errors from results. |

### Error classes

| Class | Thrown when |
|---|---|
| `StaticMismatchError` | A literal or alias token did not match. Signals "wrong command". |
| `PositionalMismatchError` | A required positional (`:name` or `:name+`) was absent. |
| `FlagParseError` | A `number` flag received a non-numeric string. |

---

## License

MIT
