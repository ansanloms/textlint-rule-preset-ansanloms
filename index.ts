// textlint は preset の入れ子 (preset の rules/rulesConfig の中に別の preset を書くこと) を
// サポートしないため、5 つの既存 textlint preset / rule パッケージの rules / rulesConfig を
// この preset の直下へ 1 段にフラット化する。
//
// フラット化した後の各ルールの options (rulesConfig の値) は、
// ansanloms/openapi-template の .textlintrc.js の rules セクションで使っていた値を
// そのまま引き継いだ既定値。
//
// textlint はユーザ設定側の options を「マージ」ではなく「置換」で適用する。
// この preset を利用する側で個別ルールの options を上書きしたい場合は、
// 該当ルールの options を丸ごと書き直す必要がある (README の「設定の上書き」参照)。

import { aiWriting, jaSpacing, jaTech, jtf, proofdictRule } from "./deps.ts";

// 1.1.2.見出し は見出し末尾の句点を検出する。autofix は効かせず検出だけにするため、
// rule に渡す context の fixer を no-op に差し替えて fix 情報そのものを作らせない
// (fixer プロパティを外すだけでは message に fix が残り、フォーマッタが fixable と表示する)。
const noopFixer: unknown = new Proxy({}, { get: () => () => undefined });
function withoutFix(linter: unknown): unknown {
  if (typeof linter !== "function") {
    return linter;
  }
  return (context: object, options?: unknown) => {
    const wrapped = new Proxy(context, {
      // report 等はアロー関数フィールドで this を閉じ込めており、かつ Object.freeze
      // された own property なので bind すると Proxy の不変条件に違反する。getter
      // (Syntax / RuleError 等) は Reflect.get の第 3 引数 target で実 context を
      // this にして評価するため、関数値も含めそのまま返す。
      get(target, prop) {
        if (prop === "fixer") {
          return noopFixer;
        }
        return Reflect.get(target, prop, target);
      },
    });
    return (linter as (ctx: object, opts?: unknown) => unknown)(
      wrapped,
      options,
    );
  };
}

// 下で "1.1.2.見出し" を条件付きで代入するため、rules は Record<string, unknown>
// として宣言する (代入前の時点では未確定のキーへの代入を型で許可するため)。
const rules: Record<string, unknown> = {
  ...jaTech.rules,
  ...jaSpacing.rules,
  ...jtf.rules,
  ...aiWriting.rules,
  proofdict: proofdictRule,
};

// jtf.rules は Record<string, unknown> 型で、1.1.2.見出し の実体が
// { linter, fixer } を持つオブジェクトであることは型では保証されない。
// upstream で形状が変わった場合に診断しづらいエラーにならないよう、ここで検証する。
// 形状が想定外のときは rules["1.1.2.見出し"] へ代入せず、上の spread (...jtf.rules)
// で入った値をそのまま残す (undefined を上書きで挿入しない)。
const headingRule = jtf.rules["1.1.2.見出し"];
if (
  typeof headingRule === "object" && headingRule !== null &&
  "linter" in headingRule &&
  typeof (headingRule as { linter: unknown }).linter === "function"
) {
  rules["1.1.2.見出し"] = {
    linter: withoutFix((headingRule as { linter: unknown }).linter),
  };
} else if (typeof headingRule === "function") {
  rules["1.1.2.見出し"] = { linter: withoutFix(headingRule) };
} else {
  console.warn(
    'textlint-rule-preset-ansanloms: jtf.rules["1.1.2.見出し"] has an unexpected shape; leaving the rule as provided by upstream',
  );
}

// この preset が独自に上書きする options。フラット化元の rulesConfig と分けて
// 定義することで、以下の「上書き先のルールが実在するか」のチェックが
// 上書きキー自体を列挙できるようにする。
const overrides = {
  // https://github.com/textlint-ja/textlint-rule-preset-ja-technical-writing
  "sentence-length": { max: 600 },
  "max-kanji-continuous-len": { max: 15 },
  "no-mix-dearu-desumasu": {
    preferInBody: "である",
    preferInHeader: "である",
    preferInList: "である",
    strict: true,
  },
  "ja-no-weak-phrase": false,
  "no-doubled-joshi": false,
  "ja-no-mixed-period": { forceAppendPeriod: true },

  // https://github.com/textlint-ja/textlint-rule-preset-ja-spacing
  "ja-space-between-half-and-full-width": { space: "always" },
  "ja-space-around-code": { before: true, after: true },
  "ja-space-around-link": { before: true, after: true },

  // https://github.com/textlint-ja/textlint-rule-preset-JTF-style
  // 文体は no-mix-dearu-desumasu が唯一決める。1.1.1.本文 は多数決で敬体を要求し矛盾する指摘を出すため無効化する。
  "1.1.1.本文": false,
  "1.1.3.箇条書き": false,
  "2.1.5.カタカナ": true,
  "3.1.1.全角文字と半角文字の間": false,
  "4.2.6.ハイフン(-)": false,
  "4.2.7.コロン(：)": false,
  "4.3.1.丸かっこ（）": false,
  "4.3.2.大かっこ［］": false,
  "4.3.7.山かっこ<>": false,

  // https://github.com/proofdict/proofdict/tree/master/packages/@proofdict/textlint-rule-proofdict
  // dictGlob (消費側 cwd 相対の辞書ファイル) はこの preset には存在しないため含めない。
  // 必要な場合は利用側で options を丸ごと置換して追加する (README 参照)。
  proofdict: {
    dictURL: "https://azu.github.io/proof-dictionary/",
    autoUpdateInterval: 1000,
  },
};

const rulesConfig = {
  ...jaTech.rulesConfig,
  ...jaSpacing.rulesConfig,
  ...jtf.rulesConfig,
  ...aiWriting.rulesConfig,
  ...overrides,
};

// フラット化元の 5 パッケージがルールを rename / 削除した場合、フラット化
// される rules のキー一覧が変わり、この preset が上書きしているルール名が
// 存在しなくなることがある。textlint は import エラーを握りつぶして
// 「ルールが見つからない」という診断しづらいエラーにしてしまうため、ここで
// throw はせず、原因を特定しやすいよう console.warn で知らせるに留める。
const unknownOverrideKeys = Object.keys(overrides).filter(
  (key) => !(key in rules),
);
if (unknownOverrideKeys.length > 0) {
  console.warn(
    `textlint-rule-preset-ansanloms: rulesConfig overrides for unknown rules (an upstream package may have renamed or removed the rule): ${
      unknownOverrideKeys.join(", ")
    }`,
  );
}

export default { rules, rulesConfig };
export { rules, rulesConfig };
export const sources = { jaTech, jaSpacing, jtf, aiWriting } as const;
// テストから直接呼び出して挙動を検証できるよう export する。
export { withoutFix };
