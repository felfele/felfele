export const jsonPrettyPrint = (obj: any) => JSON.stringify(obj, null, 4);
type OutputFunction = (...args: any[]) => void;
// tslint:disable-next-line:no-console
export let output: OutputFunction = console.log;
export const setOutput = (newOutput: OutputFunction) => output = newOutput;
