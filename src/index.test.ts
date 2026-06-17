import { Command, Commander } from './index.js';

const pkgInstall = new Command({
    description: 'Install a new package',
    positionals: 'install(i) :packages*',
    flags: {
        save: {
            type: 'boolean',
            short: 'd',
            description: 'Install as a production dependency'
        },
        saveDev: {
            type: 'boolean',
            short: 'D',
            description: 'Install as a development dependency'
        }
    },
    callback: c => ({
        onInit() {
            console.log(c);
        },
    })
});

const commander = new Commander([
    pkgInstall
]);

await commander.run();