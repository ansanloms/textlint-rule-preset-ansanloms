// この preset が依存する 5 パッケージを package.json の dependencies から直接
// import して集約し、unwrapDefault で `.default` を剥がして export する。
// バージョンは package.json で管理し、ここには書かない。

import jaTechMod from "textlint-rule-preset-ja-technical-writing";
import jaSpacingMod from "textlint-rule-preset-ja-spacing";
import jtfMod from "textlint-rule-preset-jtf-style";
import aiWritingMod from "@textlint-ja/textlint-rule-preset-ai-writing";
import proofdictMod from "@proofdict/textlint-rule-proofdict";

export type PresetModule = {
  rules: Record<string, unknown>;
  rulesConfig: Record<string, unknown>;
};

type ProofdictRule = {
  linter: unknown;
  fixer?: unknown;
};

function isPresetModule(value: unknown): value is PresetModule {
  return typeof value === "object" && value !== null && "rules" in value && "rulesConfig" in value;
}

function isProofdictRule(value: unknown): value is ProofdictRule {
  return typeof value === "object" && value !== null && "linter" in value;
}

// 一部のパッケージ (@textlint-ja/textlint-rule-preset-ai-writing,
// @proofdict/textlint-rule-proofdict) は CJS/ESM 相互運用の都合で
// default export が二重に (`mod.default.default`) ネストされることがある。
// 目的のプロパティを持つオブジェクトに辿り着くまで `.default` を辿って剥がす。
function unwrapDefault<T>(name: string, mod: unknown, isTarget: (value: unknown) => value is T): T {
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
    throw new Error(`failed to unwrap module "${name}": target property not found`);
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
export const jtf = unwrapDefault("textlint-rule-preset-jtf-style", jtfMod, isPresetModule);
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
