// この preset が依存する 5 パッケージのバージョンは、1 パッケージ 1 ファイルで
// `deps/<パッケージ名>/mod.ts` に `npm:` specifier での再 export として置く。
// この deps.ts はそれらを import して集約し、unwrapDefault で剥がすだけで、
// バージョン自体はここには書かない。`npm:` specifier で書くことで、
// 配布物 (deps/ 以下 + この deps.ts + index.ts) はリモート (jsDelivr 等) から
// 直接 fetch されたときも import map を必要とせず自己完結する。
//
// バージョンを上げる場合は `deps/<パッケージ名>/mod.ts` を書き換える。molt
// (`deno task update` / `deno task update:write`) にこれらのファイルを
// 直接指定すれば自動更新できる (README の「依存の更新」参照)。

import jaTechMod from "./deps/textlint-rule-preset-ja-technical-writing/mod.ts";
import jaSpacingMod from "./deps/textlint-rule-preset-ja-spacing/mod.ts";
import jtfMod from "./deps/textlint-rule-preset-jtf-style/mod.ts";
import aiWritingMod from "./deps/@textlint-ja/textlint-rule-preset-ai-writing/mod.ts";
import proofdictMod from "./deps/@proofdict/textlint-rule-proofdict/mod.ts";

export type PresetModule = {
  rules: Record<string, unknown>;
  rulesConfig: Record<string, unknown>;
};

type ProofdictRule = {
  linter: unknown;
  fixer?: unknown;
};

function isPresetModule(value: unknown): value is PresetModule {
  return typeof value === "object" && value !== null && "rules" in value &&
    "rulesConfig" in value;
}

function isProofdictRule(value: unknown): value is ProofdictRule {
  return typeof value === "object" && value !== null && "linter" in value;
}

// 一部のパッケージ (@textlint-ja/textlint-rule-preset-ai-writing,
// @proofdict/textlint-rule-proofdict) は CJS/ESM 相互運用の都合で
// default export が二重に (`mod.default.default`) ネストされることがある。
// 目的のプロパティを持つオブジェクトに辿り着くまで `.default` を辿って剥がす。
function unwrapDefault<T>(
  name: string,
  mod: unknown,
  isTarget: (value: unknown) => value is T,
): T {
  let current = mod;
  while (
    !isTarget(current) &&
    typeof current === "object" &&
    current !== null &&
    "default" in current
  ) {
    const next = (current as { default: unknown }).default;
    if (next === current) {
      break;
    }
    current = next;
  }
  if (!isTarget(current)) {
    throw new Error(
      `failed to unwrap module "${name}": target property not found`,
    );
  }
  return current;
}

export const jaTech = unwrapDefault(
  "textlint-rule-preset-ja-technical-writing",
  jaTechMod,
  isPresetModule,
);
export const jaSpacing = unwrapDefault(
  "textlint-rule-preset-ja-spacing",
  jaSpacingMod,
  isPresetModule,
);
export const jtf = unwrapDefault(
  "textlint-rule-preset-jtf-style",
  jtfMod,
  isPresetModule,
);
export const aiWriting = unwrapDefault(
  "@textlint-ja/textlint-rule-preset-ai-writing",
  aiWritingMod,
  isPresetModule,
);
export const proofdictRule = unwrapDefault(
  "@proofdict/textlint-rule-proofdict",
  proofdictMod,
  isProofdictRule,
);
