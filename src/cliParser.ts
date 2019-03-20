const optionNameHumanSeparator = ', ';

type Printer = (...args: any[]) => void;

type Action = (...args: string[]) => void;

interface Argument {
    name: string;
    required: boolean;
}

interface Option {
    names: string[];
    args: Argument[];
    description: string;
    action: Action;
}

interface Command {
    name: string;
    args: Argument[];
    description: string;
    actionOrDefinition: Action | Definition;
}

interface Definition {
    options: Option[];
    commands: Command[];
}

const isAction = (a: Action | Definition): a is Action => {
    return (a as Definition).commands === undefined;
};

const isDefinition = (d: Action | Definition): d is Definition => !isAction(d);

interface CommandAdder extends Definition {
    addCommand: (name: string, description: string, actionOrSubCommand: Action | Definition) => CommandAdder;
}

interface OptionAdder extends CommandAdder {
    addOption: (name: string, description: string, action: Action) => OptionAdder;
}

const defineArguments = (defArgs: string[]): Argument[] => {
    let required = true;
    const args: Argument[] = [];
    for (const defArg of defArgs) {
        if (defArg.startsWith('<') && defArg.endsWith('>')) {
            if (!required) {
                throwError(`cannot define required argument after optional arguments: ${defArg}`);
            }
            args.push({
                name: defArg,
                required,
            });
        }
        else if (defArg.startsWith('[') && defArg.endsWith(']')) {
            required = false;
            args.push({
                name: defArg,
                required,
            });
        }
        else {
            throwError(`syntax error: argument ${defArg}`);
        }
    }
    return args;
};

const defineOption = (nameDef: string, description: string, action: Action): Option => {
    const optionNameSeparator = '|';
    const canonicalOptionName = nameDef.replace(optionNameHumanSeparator, optionNameSeparator);
    const optionArguments = canonicalOptionName.split(' ');
    const namesPart = optionArguments[0];
    const names = namesPart.split(optionNameSeparator).map(name => name.trim());
    const args = defineArguments(optionArguments.slice(1));
    return {
        names,
        args,
        description,
        action,
    };
};

const defineCommand = (nameDef: string, description: string, actionOrDefinition: Action | Definition): Command => {
    const nameParts = nameDef.split(' ');
    const name = nameParts[0];
    const args = defineArguments(nameParts.slice(1));
    return {
        name,
        args,
        description,
        actionOrDefinition,
    };
};

export const emptyDefinition = {
    options: [],
    commands: [],
};

const defineProgram = (definition: Definition = emptyDefinition): OptionAdder => {
    const addBaseOption = (usage: Definition, name: string, description: string, action: Action): OptionAdder => {
        const newUsage = {
            ...usage,
            options: [...usage.options, defineOption(name, description, action)],
        };
        return {
            ...newUsage,
            addOption: (pName, pDescription, pAction) => addBaseOption(newUsage, pName, pDescription, pAction),
            addCommand: (pName, pDescription, pAction) => addBaseCommand(newUsage, pName, pDescription, pAction),
        };
    };
    const addBaseCommand = (usage: Definition, name: string, description: string, actionOrDefinition: Action | Definition): CommandAdder => {
        const newUsage = {
            ...usage,
            commands: [...usage.commands, defineCommand(name, description, actionOrDefinition)],
        };
        return {
            ...newUsage,
            addCommand: (pName, pDescription, pAction) => addBaseCommand(newUsage, pName, pDescription, pAction),
        };
    };
    return {
        ...definition,
        addOption: (name, description, action) =>
            addBaseOption(definition, name, description, action),
        addCommand: (name, description, action) =>
            addBaseCommand(definition, name, description, action),
    };
};

const helpOption = defineOption('-h, --help', 'output usage information', () => {});

export const addOption = (name: string, description: string, action: Action): OptionAdder => {
    const definition = {
        options: [helpOption, defineOption(name, description, action)],
        commands: [],
    };
    return defineProgram(definition);
};

export const addCommand = (name: string, description: string, actionOrSubCommand: Action | Definition): CommandAdder => {
    const definition = {
        options: [helpOption],
        commands: [defineCommand(name, description, actionOrSubCommand)],
    };
    return defineProgram(definition);
};

const describeSubcommands = (commands: Command[]): string =>
    commands.length === 0
    ? ''
    : '<' + commands.map(command => command.name.split(' ')[0]).join('|') + '>';

const describeCommandArguments = (command: Command): string => {
    if (isAction(command.actionOrDefinition)) {
        return command.args.map(arg => arg.name).join(' ');
    }
    if (command.actionOrDefinition.commands.length === 0) {
        return '';
    }
    return describeSubcommands(command.actionOrDefinition.commands);
};

const describeCommand = (command: Command): string => {
    const desc = describeCommandArguments(command);
    return `${command.name} ${desc}`;
};

const padWithSpace = (input: string, width: number): string => {
    let padded = input;
    while (padded.length < width) {
        padded += ' ';
    }
    return padded;
};

const printUsage = (context: Context, print: Printer) => {
    const command = context.command;
    const definition = isDefinition(command.actionOrDefinition)
        ? command.actionOrDefinition
        : emptyDefinition
        ;

    const options = definition.options.length === 0
        ? [helpOption]
        : definition.options
        ;

    const subcommandDescription = isDefinition(command.actionOrDefinition)
        ? describeSubcommands(command.actionOrDefinition.commands)
        : describeCommandArguments(command)
        ;

    print(`Usage: ${context.command.name} [options] ${subcommandDescription}`);
    print('');
    if (command.description !== '') {
        print(command.description);
        print('');
    }

    print('Options:');

    const longestOptionLength = options.reduce<number>((longest, option) =>
        option.names.join(optionNameHumanSeparator).length > longest
        ? option.names.join(optionNameHumanSeparator).length
        : longest
    , 0);

    const longestCommandLength = definition.commands.reduce<number>((longest, subCommand) =>
        describeCommand(subCommand).length > longest
        ? describeCommand(subCommand).length
        : longest
    , longestOptionLength);

    const namePadding = longestCommandLength + 10;
    for (const option of options) {
        const optionName = option.names.join(optionNameHumanSeparator);
        print(`  ${padWithSpace(optionName, namePadding)}${option.description}`);
    }

    if (definition.commands.length > 0) {
        print('');
        print('Commands:');
    }
    for (const subCommand of definition.commands) {
        const desc = describeCommand(subCommand);
        print(`  ${padWithSpace(desc, namePadding)}${subCommand.description}`);
    }
};

const printableProgramName = (fullPath: string): string => {
    const stripExtension = (s: string) => {
        const indexOfJSExtension = s.lastIndexOf('.js');
        return indexOfJSExtension === -1
            ? s
            : s.slice(0, indexOfJSExtension);
    };
    const stripPath = (s: string) => s.slice(s.lastIndexOf('/') + 1);
    const withoutExtension = stripExtension(fullPath);
    const withoutPath = stripPath(withoutExtension);
    return withoutPath;
};

const isOption = (arg: string): boolean => arg.startsWith('-');

type ErrorHandler = (message: string) => void;

const throwError = (message: string) => { throw new Error(message); };
const throwOptionError = (name: string) => throwError(`unknown option \`${name}'`);
const throwOptionMissingParameterError = (name: string) => throwError(`missing parameter to option \`${name}'`);
const throwCommandError = (name: string) => throwError(`unknown command \`${name}'`);
const throwCommandMissingParameterError = (command: Command) => throwError(`missing parameter to command \`${command.name}': ${describeCommandArguments(command)}`);

interface Context {
    command: Command;
    args: string[];
    definition: Definition;
}

const lookupOption = (optionName: string, options: Option[]): Option | never => {
    for (const option of options) {
        for (const name of option.names) {
            if (optionName === name) {
                return option;
            }
        }
    }
    return throwOptionError(optionName);
};

const executionOptionAction = (optionName: string, context: Context, printer: Printer): Context | never => {
    const option = lookupOption(optionName, context.definition.options);
    const optionRequiredArgs = option.args.filter(arg => arg.required);

    const hasRequiredArgs = context.args.length >= optionRequiredArgs.length;
    if (!hasRequiredArgs) {
        return throwOptionMissingParameterError(optionName);
    }

    if (option === helpOption) {
        printUsage(context, printer);
        return {
            ...context,
            definition: emptyDefinition,
            args: [],
        };
    }

    option.action(...context.args.slice(0, option.args.length));
    return {
        ...context,
        args: context.args.slice(option.args.length),
    };
};

const lookupCommand = (commandName: string, commands: Command[]): Command | never => {
    for (const command of commands) {
        if (command.name === commandName) {
            return command;
        }
    }
    return throwCommandError(commandName);
};

const executeCommandAction = (commandName: string, context: Context, printer: Printer): Context => {
    const command = lookupCommand(commandName, context.definition.commands);

    if (isDefinition(command.actionOrDefinition)) {
        return {
            ...context,
            command,
            definition: command.actionOrDefinition,
        };
    }

    const commandRequiredArgs = command.args.filter(arg => arg.required);
    const commandArgs = [...context.args.slice(0, command.args.length)];
    if (commandArgs.length < commandRequiredArgs.length) {
        throwCommandMissingParameterError(command);
    }

    // special case for help
    if (context.args.length > 0 && isOption(context.args[0])) {
        const option = lookupOption(context.args[0], context.definition.options);
        if (option === helpOption) {
            const helpContext = {
                ...context,
                command,
            };
            printUsage(helpContext, printer);
            return {
                ...context,
                definition: emptyDefinition,
                args: [],
            };
        }
    }

    command.actionOrDefinition(...commandArgs);
    return {
        ...context,
        command,
        args: context.args.slice(command.args.length),
    };
};

const readArgAndExecute = (context: Context, printer: Printer): Context => {
    if (context.args.length === 0) {
        return context;
    }

    const arg = context.args[0];
    const subContext = {
        ...context,
        args: context.args.slice(1),
    };

    if (isOption(arg)) {
        return executionOptionAction(arg, subContext, printer);
    } else {
        return executeCommandAction(arg, subContext, printer);
    }
};

// tslint:disable-next-line:no-console
const output = console.log;

export const parseArguments = (
    args: string[],
    definition: Definition,
    printer: Printer = output,
    errorHandler: ErrorHandler = throwError,
) => {
    const name = printableProgramName(args[1]);
    let context: Context = {
        command: {
            name,
            args: [],
            description: '',
            actionOrDefinition: definition,
        },
        args: args.slice(2),
        definition,
    };
    if (args.length === 2) {
        printUsage(context, printer);
        return;
    }

    try {
        while (context.args.length > 0) {
            context = readArgAndExecute(context, printer);
        }
    } catch (e) {
        errorHandler(e.message);
        return;
    }
};
