import { addOption, parseArguments, addCommand, emptyDefinition } from '../src/cliParser';

const baseArgs = ['', ''];
const helpOption = '-h';

test('help is always implicitly defined if any option is defined', () => {
    let helpOutput = '';

    const option = '-o';
    const definition = addOption(option, '', () => {});
    const args = baseArgs.concat([helpOption]);
    parseArguments(args, definition, (msg) => helpOutput += msg);

    expect(helpOutput).toMatch('Usage: ');
});

test('help is always implicitly defined if any command is defined', () => {
    let helpOutput = '';

    const command = 'command';
    const definition = addCommand(command, '', () => {});
    const args = baseArgs.concat([helpOption]);
    parseArguments(args, definition, (msg) => helpOutput += msg);

    expect(helpOutput).toMatch('Usage: ');
});

test('basic option', () => {
    let optionActionCalled = false;

    const option = '-o';
    const definition = addOption(option, '', () => optionActionCalled = true);
    const args = baseArgs.concat([option]);
    parseArguments(args, definition);

    expect(optionActionCalled).toBeTruthy();
});

test('basic option with short alternative', () => {
    let optionActionCalled = false;

    const shortOption = '-q';
    const longOption = '--quiet';
    const option = `${shortOption}, ${longOption}`;
    const definition = addOption(option, '', () => optionActionCalled = true);
    const args = baseArgs.concat([shortOption]);
    parseArguments(args, definition);

    expect(optionActionCalled).toBeTruthy();
});

test('basic option with long alternative', () => {
    let optionActionCalled = false;

    const shortOption = '-q';
    const longOption = '--quiet';
    const option = `${shortOption}, ${longOption}`;
    const definition = addOption(option, '', () => optionActionCalled = true);
    const args = baseArgs.concat([longOption]);
    parseArguments(args, definition);

    expect(optionActionCalled).toBeTruthy();
});

test('option with parameter', () => {
    let optionActionCalled = false;
    let optionActionArgValue;

    const option = '-o';
    const optionDef = `${option} <arg>`;
    const optionArgValue = 'hello';
    const definition = addOption(optionDef, '', (arg) => {
        optionActionCalled = true;
        optionActionArgValue = arg;
    });
    const args = baseArgs.concat([option, optionArgValue]);
    parseArguments(args, definition);

    expect(optionActionCalled).toBeTruthy();
    expect(optionActionArgValue).toEqual(optionArgValue);
});

test('option with short alternative and parameter', () => {
    let optionActionCalled = false;
    let optionActionArgValue;

    const shortOption = '-q';
    const longOption = '--quiet';
    const optionDef = `${shortOption}, ${longOption} <arg>`;
    const optionArgValue = 'hello';
    const definition = addOption(optionDef, '', (arg) => {
        optionActionCalled = true;
        optionActionArgValue = arg;
    });
    const args = baseArgs.concat([shortOption, optionArgValue]);
    parseArguments(args, definition);

    expect(optionActionCalled).toBeTruthy();
    expect(optionActionArgValue).toEqual(optionArgValue);
});

test('option with long alternative and parameter', () => {
    let optionActionCalled = false;
    let optionActionArgValue;

    const shortOption = '-q';
    const longOption = '--quiet';
    const optionDef = `${shortOption}, ${longOption} <arg>`;
    const optionArgValue = 'hello';
    const definition = addOption(optionDef, '', (arg) => {
        optionActionCalled = true;
        optionActionArgValue = arg;
    });
    const args = baseArgs.concat([longOption, optionArgValue]);
    parseArguments(args, definition);

    expect(optionActionCalled).toBeTruthy();
    expect(optionActionArgValue).toEqual(optionArgValue);
});

test('option with parameter without argument should fail', () => {
    const option = '-o';
    const optionDef = `${option} <arg>`;
    const definition = addOption(optionDef, '', (arg) => {});
    const args = baseArgs.concat([option]);
    const t = () => {
        parseArguments(args, definition);
    };

    expect(t).toThrow(`missing parameter to option \`${option}'`);
});

test('option with optional parameter without argument should not fail', () => {
    let optionActionArgValue = '';

    const option = '-o';
    const optionDef = `${option} [arg]`;
    const definition = addOption(optionDef, '', (arg) => optionActionArgValue = arg);
    const args = baseArgs.concat([option]);
    parseArguments(args, definition);

    expect(optionActionArgValue).toBeUndefined();
});

test('unknown option', () => {
    const option = '-o';
    const definition = emptyDefinition;
    const args = baseArgs.concat([option]);

    const t = () => {
        parseArguments(args, definition);
    };

    expect(t).toThrow('unknown option `-o\'');
});

test('basic command', () => {
    let commandActionCalled = false;

    const command = 'command';
    const definition = addCommand(command, '', () => commandActionCalled = true);
    const args = baseArgs.concat(command);
    parseArguments(args, definition);

    expect(commandActionCalled).toBeTruthy();
});

test('command with parameter without argument should fail', () => {
    const command = 'command';
    const commandDef = `${command} <arg>`;
    const definition = addCommand(commandDef, '', (arg) => {});
    const args = baseArgs.concat([command]);
    const t = () => {
        parseArguments(args, definition);
    };

    expect(t).toThrow(`missing parameter to command \`${command}': <arg>`);
});

test('command with optional parameter without argument should not fail', () => {
    let commandActionArgument = '';

    const command = 'command';
    const commandDef = `${command} [arg]`;
    const definition = addCommand(commandDef, '', (arg) => commandActionArgument = arg);
    const args = baseArgs.concat([command]);
    parseArguments(args, definition);

    expect(commandActionArgument).toBeUndefined();
});

test('command with required parameter after optional parameter should fail', () => {
    const command = 'command';
    const commandDef = `${command} [opt] <arg>`;
    const t = () => {
        const definition = addCommand(commandDef, '', (arg) => {});
    };

    expect(t).toThrow(`cannot define required argument after optional arguments: <arg>`);
});

test('command with parameter', () => {
    let commandActionCalled = false;
    let commandActionArgValue;

    const command = 'command';
    const commandDef = `${command} <arg>`;
    const commandArgValue = 'hello';
    const definition = addCommand(commandDef, '', (arg) => {
        commandActionCalled = true;
        commandActionArgValue = arg;
    });
    const args = baseArgs.concat([command, commandArgValue]);
    parseArguments(args, definition);

    expect(commandActionCalled).toBeTruthy();
    expect(commandActionArgValue).toEqual(commandArgValue);
});

test('unknown command', () => {
    const unknown = 'unknown';
    const definition = emptyDefinition;
    const args = baseArgs.concat(unknown);

    const t = () => {
        parseArguments(args, definition);
    };

    expect(t).toThrow(`unknown command \`${unknown}'`);
});

test('basic option and command', () => {
    let commandActionCalled = false;
    let optionActionCalled = false;

    const option = '-o';
    const command = 'command';
    const definition = addOption(option, '', () => optionActionCalled = true)
        .addCommand(command, '', () => commandActionCalled = true);
    const args = baseArgs.concat([option, command]);
    parseArguments(args, definition);

    expect(optionActionCalled).toBeTruthy();
    expect(commandActionCalled).toBeTruthy();
});

test('several commands', () => {
    let command1ActionCalled = false;
    let command2ActionCalled = false;

    const command1 = 'command1';
    const command2 = 'command2';
    const definition = addCommand(command1, '', () => command1ActionCalled = true)
        .addCommand(command2, '', () => command2ActionCalled = true);
    const args = baseArgs.concat([command1]);
    parseArguments(args, definition);

    expect(command1ActionCalled).toBeTruthy();
    expect(command2ActionCalled).toBeFalsy();
});

test('basic subcommand', () => {
    let subcommandActionCalled = false;

    const command = 'command';
    const subcommand = 'subcommand';
    const definition = addCommand(command, '',
        addCommand(subcommand, '', () => subcommandActionCalled = true)
    );

    const args = baseArgs.concat([command, subcommand]);
    parseArguments(args, definition);

    expect(subcommandActionCalled).toBeTruthy();
});

test('basic subcommand with help on command', () => {
    let subcommandActionCalled = false;
    let helpOutput = '';

    const command = 'command';
    const subcommand = 'subcommand';
    const definition = addCommand(command, '',
        addCommand(subcommand, '', () => subcommandActionCalled = true)
    );

    const args = baseArgs.concat([command, helpOption]);
    parseArguments(args, definition, (msg) => helpOutput += msg);

    expect(subcommandActionCalled).toBeFalsy();
    expect(helpOutput).toMatch('Usage: ');
});

test('basic subcommand with help on subcommand', () => {
    let subcommandActionCalled = false;
    let helpOutput = '';

    const command = 'command';
    const subcommand = 'subcommand';
    const definition = addCommand(command, '',
        addCommand(subcommand, '', () => subcommandActionCalled = true)
    );

    const args = baseArgs.concat([command, subcommand, helpOption]);
    parseArguments(args, definition, (msg) => helpOutput += msg);

    expect(subcommandActionCalled).toBeFalsy();
    expect(helpOutput).toMatch('Usage: ');
});

test('subcommand with option', () => {
    let subcommandActionCalled = false;
    let subcommandOptionActionCalled = false;
    let subcommandOptionActionArg;

    const command = 'command';
    const subcommand = 'subcommand';
    const option = '-o';
    const optionDef = `${option} <arg>`;
    const optionArgValue = 'hello';
    const definition = addCommand(command, '',
        addOption(optionDef, '', (arg) => {
            subcommandOptionActionCalled = true;
            subcommandOptionActionArg = arg;
        })
        .
        addCommand(subcommand, '', () => subcommandActionCalled = true)
    );

    const args = baseArgs.concat([command, option, optionArgValue, subcommand]);
    parseArguments(args, definition);

    expect(subcommandActionCalled).toBeTruthy();
    expect(subcommandOptionActionCalled).toBeTruthy();
    expect(subcommandOptionActionArg).toEqual(optionArgValue);
});
