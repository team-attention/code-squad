import { existsSync, readFileSync, appendFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir } from 'os';

// Only run for global installs
if (process.env.npm_config_global !== 'true') {
    process.exit(0);
}

const shell = basename(process.env.SHELL || '');
const home = homedir();

let rcFile;
let initLine;

switch (shell) {
    case 'zsh':
        rcFile = join(process.env.ZDOTDIR || home, '.zshrc');
        initLine = 'eval "$(csq --init)"';
        break;
    case 'bash':
        rcFile = existsSync(join(home, '.bashrc'))
            ? join(home, '.bashrc')
            : join(home, '.bash_profile');
        initLine = 'eval "$(csq --init)"';
        break;
    case 'fish':
        rcFile = join(
            process.env.XDG_CONFIG_HOME || join(home, '.config'),
            'fish',
            'config.fish'
        );
        initLine = 'csq init | source';
        break;
    default:
        process.exit(0);
}

// Already configured
if (existsSync(rcFile)) {
    const content = readFileSync(rcFile, 'utf-8');
    if (content.includes('csq --init') || content.includes('csq init')) {
        process.exit(0);
    }
}

try {
    mkdirSync(dirname(rcFile), { recursive: true });
    appendFileSync(rcFile, `\n# Code Squad CLI\n${initLine}\n`);
    console.log('');
    console.log(`  \u2713 csq: shell integration added to ${rcFile}`);
    console.log('    Restart your terminal to activate.');
    console.log('');
} catch {
    // Don't break install
}
