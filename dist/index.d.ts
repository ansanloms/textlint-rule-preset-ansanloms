declare function withoutFix(linter: unknown): unknown;
declare const rules: Record<string, unknown>;
declare const rulesConfig: {
    "sentence-length": {
        max: number;
    };
    "max-kanji-continuous-len": {
        max: number;
    };
    "no-mix-dearu-desumasu": {
        preferInBody: string;
        preferInHeader: string;
        preferInList: string;
        strict: boolean;
    };
    "ja-no-weak-phrase": boolean;
    "no-doubled-joshi": boolean;
    "ja-no-mixed-period": {
        forceAppendPeriod: boolean;
    };
    "ja-space-between-half-and-full-width": {
        space: string;
    };
    "ja-space-around-code": {
        before: boolean;
        after: boolean;
    };
    "ja-space-around-link": {
        before: boolean;
        after: boolean;
    };
    "1.1.1.\u672C\u6587": boolean;
    "1.1.3.\u7B87\u6761\u66F8\u304D": boolean;
    "2.1.5.\u30AB\u30BF\u30AB\u30CA": boolean;
    "3.1.1.\u5168\u89D2\u6587\u5B57\u3068\u534A\u89D2\u6587\u5B57\u306E\u9593": boolean;
    "4.2.6.\u30CF\u30A4\u30D5\u30F3(-)": boolean;
    "4.2.7.\u30B3\u30ED\u30F3(\uFF1A)": boolean;
    "4.3.1.\u4E38\u304B\u3063\u3053\uFF08\uFF09": boolean;
    "4.3.2.\u5927\u304B\u3063\u3053\uFF3B\uFF3D": boolean;
    "4.3.7.\u5C71\u304B\u3063\u3053<>": boolean;
    proofdict: {
        dictURL: string;
        autoUpdateInterval: number;
    };
    "no-ai-list-formatting": {
        disableBoldListItems: boolean;
    };
};
declare const _default: {
    rules: Record<string, unknown>;
    rulesConfig: {
        "sentence-length": {
            max: number;
        };
        "max-kanji-continuous-len": {
            max: number;
        };
        "no-mix-dearu-desumasu": {
            preferInBody: string;
            preferInHeader: string;
            preferInList: string;
            strict: boolean;
        };
        "ja-no-weak-phrase": boolean;
        "no-doubled-joshi": boolean;
        "ja-no-mixed-period": {
            forceAppendPeriod: boolean;
        };
        "ja-space-between-half-and-full-width": {
            space: string;
        };
        "ja-space-around-code": {
            before: boolean;
            after: boolean;
        };
        "ja-space-around-link": {
            before: boolean;
            after: boolean;
        };
        "1.1.1.\u672C\u6587": boolean;
        "1.1.3.\u7B87\u6761\u66F8\u304D": boolean;
        "2.1.5.\u30AB\u30BF\u30AB\u30CA": boolean;
        "3.1.1.\u5168\u89D2\u6587\u5B57\u3068\u534A\u89D2\u6587\u5B57\u306E\u9593": boolean;
        "4.2.6.\u30CF\u30A4\u30D5\u30F3(-)": boolean;
        "4.2.7.\u30B3\u30ED\u30F3(\uFF1A)": boolean;
        "4.3.1.\u4E38\u304B\u3063\u3053\uFF08\uFF09": boolean;
        "4.3.2.\u5927\u304B\u3063\u3053\uFF3B\uFF3D": boolean;
        "4.3.7.\u5C71\u304B\u3063\u3053<>": boolean;
        proofdict: {
            dictURL: string;
            autoUpdateInterval: number;
        };
        "no-ai-list-formatting": {
            disableBoldListItems: boolean;
        };
    };
};
export default _default;
export { rules, rulesConfig };
export declare const sources: {
    readonly jaTech: import("./deps.ts").PresetModule;
    readonly jaSpacing: import("./deps.ts").PresetModule;
    readonly jtf: import("./deps.ts").PresetModule;
    readonly aiWriting: import("./deps.ts").PresetModule;
};
export { withoutFix };
