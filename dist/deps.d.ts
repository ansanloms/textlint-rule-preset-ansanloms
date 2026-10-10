export type PresetModule = {
    rules: Record<string, unknown>;
    rulesConfig: Record<string, unknown>;
};
type ProofdictRule = {
    linter: unknown;
    fixer?: unknown;
};
export declare const jaTech: PresetModule;
export declare const jaSpacing: PresetModule;
export declare const jtf: PresetModule;
export declare const aiWriting: PresetModule;
export declare const proofdictRule: ProofdictRule;
export {};
