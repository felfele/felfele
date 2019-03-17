const optionNameHumanSeparator = ', ';

type Printer = (...args: any[]) => void;

type Action = (...args: string[]) => void;

interface Option {
    names: string[];
    args: string[];
    description: string;
    action: Action;
}

interface Command {
    name: string;
    args: string[];
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

interface CommandAdder extends Definition {
    addCommand: (name: string, description: string, actionOrSubCommand: Action | Definition) => CommandAdder;
}

interface OptionAdder extends CommandAdder {
    addOption: (name: string, description: string, action: Action) => OptionAdder;
}

const defineOption = (nameDef: string, description: string, action: Action): Option => {
    const optionNameSeparator = '|';
    const canonicalOptionName = nameDef.replace(optionNameHumanSeparator, optionNameSeparator);
    const optionArguments = canonicalOptionName.split(' ');
    const namesPart = optionArguments[0];
    const names = namesPart.split(optionNameSeparator).map(name => name.trim());
    const args = optionArguments.slice(1);
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
    const args = nameParts.slice(1);
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

const subcommandDescription = (commands: Command[]): string =>
    '<' + commands.map(command => command.name.split(' ')[0]).join('|') + '>';

const commandArgumentsDescription = (command: Command): string => {
    if (isAction(command.actionOrDefinition)) {
        return command.args.join(' ');
    }
    if (command.actionOrDefinition.commands.length === 0) {
        return '';
    }
    return subcommandDescription(command.actionOrDefinition.commands);
};

const padWithSpace = (input: string, width: number): string => {
    let padded = input;
    while (padded.length < width) {
        padded += ' ';
    }
    return padded;
};

const printUsage = (name: string, definition: Definition, printer: Printer) => {
    printer(`Usage: ${name} [options] ${subcommandDescription(definition.commands)}`);
    printer('');
    printer('Options:');

    const namePadding = 46;
    for (const option of definition.options) {
        const optionName = option.names.join(optionNameHumanSeparator);
        printer(`  ${padWithSpace(optionName, namePadding)}${option.description}`);
    }

    printer('');
    printer('Commands:');
    for (const command of definition.commands) {
        const desc = commandArgumentsDescription(command);
        const commandName = `${command.name} ${desc}`;
        printer(`  ${padWithSpace(commandName, namePadding)}${command.description}`);
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
const throwCommandMissingParameterError = (name: string) => throwError(`missing parameter to command \`${name}'`);

interface OptionLookup {
    [name: string]: Option;
}

interface Context {
    name: string;
    args: string[];
    definition: Definition;
}

const readArgAndExecute = (context: Context, printer: Printer): Context => {
    const {args, definition} = context;
    if (args.length === 0) {
        return context;
    }

    const optionLookup: OptionLookup = {};
    for (const option of definition.options) {
        for (const name of option.names) {
            optionLookup[name] = option;
        }
    }

    if (isOption(args[0])) {
        const option = optionLookup[args[0]] || throwOptionError(args[0]);
        if (option === helpOption) {
            printUsage(context.name, context.definition, printer);
            return {
                ...context,
                args: [],
            };
        }
        else if (args.length - 1 >= option.args.length) {
            option.action(...args.slice(1, 1 + option.args.length));
            return {
                name: context.name,
                args: args.slice(1 + option.args.length),
                definition: context.definition,
            };
        }
        throwOptionMissingParameterError(args[0]);
    } else {
        for (const command of definition.commands) {
            if (command.name === args[0]) {
                if (isAction(command.actionOrDefinition)) {
                    const commandArgs = [...args.slice(1, 1 + command.args.length)];
                    if (commandArgs.length < command.args.length) {
                        throwCommandMissingParameterError(command.name);
                    }
                    command.actionOrDefinition(...commandArgs);
                    return {
                        name: command.name,
                        args: args.slice(1 + command.args.length),
                        definition: context.definition,
                    };
                } else {
                    return {
                        name: command.name,
                        args: args.slice(1),
                        definition: command.actionOrDefinition,
                    };
                }
            }
        }
        throwCommandError(args[0]);
    }
    // control never reaches here, because we throw errors, however they are
    // wrapped in functions so the compiler doesn't recognize them
    return context;
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
    if (args.length === 2) {
        printUsage(name, definition, printer);
        return;
    }

    try {
        let context = {
            name,
            args: args.slice(2),
            definition,
        };

        while (context.args.length > 0) {
            context = readArgAndExecute(context, printer);
        }
    } catch (e) {
        errorHandler(e.message);
        return;
    }
};
