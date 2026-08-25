// この preset が依存する 5 パッケージのバージョンをここに固定する。`npm:`
// specifier で書くことで、この deps.ts (および import 元の index.ts) は
// リモート (jsDelivr 等) から直接 fetch されたときも import map を必要とせず
// 自己完結する。
//
// Dependabot は `.ts` ファイルを読まないため、この 5 パッケージのバージョンは
// Dependabot による自動更新の対象外。バージョンを上げる場合は、このファイルを
// 手動で書き換える。

import jaTechMod from "npm:textlint-rule-preset-ja-technical-writing@12.0.2";
import jaSpacingMod from "npm:textlint-rule-preset-ja-spacing@3.0.3";
import jtfMod from "npm:textlint-rule-preset-jtf-style@3.0.3";
import aiWritingMod from "npm:@textlint-ja/textlint-rule-preset-ai-writing@1.7.0";
import proofdictMod from "npm:@proofdict/textlint-rule-proofdict@3.1.2";

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
