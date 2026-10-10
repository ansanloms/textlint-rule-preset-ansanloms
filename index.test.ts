import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import { test } from "node:test";
import { TextlintKernel } from "@textlint/kernel";
import markdownPluginMod from "@textlint/textlint-plugin-markdown";
import { rules, rulesConfig, sources, withoutFix } from "./index.ts";

// CJS/ESM 相互運用で default export が `{ default: { Processor } }` の形で
// 1 段ネストされるため、テストでも `.default` を 1 段剥がす。
const markdownPlugin = (markdownPluginMod as { default?: unknown }).default ?? markdownPluginMod;

function isRuleValue(value: unknown): boolean {
  return (
    typeof value === "function" ||
    (typeof value === "object" && value !== null && ("linter" in value || "fixer" in value))
  );
}

test("rules は 5 パッケージ分をフラット化した 77 個を持つ", () => {
  assert.deepEqual(Object.keys(rules).length, 77);
});

test("rules のキー数はフラット化元 4 パッケージの rules 数 + proofdict の合計と一致する", () => {
  // Object.keys(rules).length だけを見ると、フラット化元のキーが偶然重複して
  // spread で上書き (shadowing) された場合もルール総数が同じに見えてしまい
  // 検出できない。各パッケージの rules 数を個別に積算した期待値と突合することで、
  // そのような衝突を検出する。
  const expected = Object.values(sources).reduce((n, s) => n + Object.keys(s.rules).length, 0) + 1; // +1 は proofdict
  assert.deepEqual(Object.keys(rules).length, expected);
});

test("rulesConfig のキー集合は rules のキー集合と一致する", () => {
  const ruleKeys = new Set(Object.keys(rules));
  const configKeys = new Set(Object.keys(rulesConfig));
  assert.deepEqual(configKeys, ruleKeys);
});

test("rules の各値は関数、または linter/fixer を持つオブジェクトである", () => {
  for (const [key, value] of Object.entries(rules)) {
    assert.deepEqual(isRuleValue(value), true, `rules.${key} の形が不正`);
  }
});

test("openapi-template 由来の options 上書きが反映されている", () => {
  assert.deepEqual((rulesConfig as Record<string, unknown>)["sentence-length"], { max: 600 });
  assert.deepEqual((rulesConfig as Record<string, unknown>)["no-mix-dearu-desumasu"], {
    preferInBody: "である",
    preferInHeader: "である",
    preferInList: "である",
    strict: true,
  });
  assert.deepEqual((rulesConfig as Record<string, unknown>)["no-doubled-joshi"], false);
  assert.deepEqual(
    (rulesConfig as Record<string, unknown>)["ja-space-between-half-and-full-width"],
    { space: "always" },
  );
  assert.deepEqual((rulesConfig as Record<string, unknown>)["1.1.1.本文"], false);
});

// この 2 つは openapi-template の値とは異なる、この preset 独自の判断
// (2.1.5.カタカナ は openapi-template では true、no-ai-list-formatting は
// openapi-template に存在しない) であり、意図しない変更に気付けるよう固定する。
test("この preset 独自の上書きが反映されている", () => {
  assert.deepEqual((rulesConfig as Record<string, unknown>)["2.1.5.カタカナ"], false);
  assert.deepEqual(rulesConfig["no-ai-list-formatting"], { disableBoldListItems: true });
});

test("1.1.2.見出し は upstream 既定 (true) のまま有効で、fixer を持たない", () => {
  assert.deepEqual((rulesConfig as Record<string, unknown>)["1.1.2.見出し"], true);
  const value = (rules as Record<string, unknown>)["1.1.2.見出し"];
  assert.deepEqual(typeof value === "object" && value !== null, true);
  assert.deepEqual("linter" in (value as Record<string, unknown>), true);
  assert.deepEqual("fixer" in (value as Record<string, unknown>), false);
});

// 実際の @textlint/kernel の TextlintRuleContextImpl は fixer / Syntax を
// prototype 上の getter (アクセサ) として持ち、report はインスタンスの
// アロー関数フィールドとして持つ。その形を模した上で constructor 末尾で
// Object.freeze(this) する (実際の実装と同じ凍結の仕方)。プレーンなデータ
// プロパティのまま freeze すると、withoutFix の Proxy が fixer に別の値を
// 返す際に Proxy の不変条件 (frozen own data property は同じ値を返す必要が
// ある) に違反してしまうため、production の形に合わせる必要がある。
class StubContext {
  static syntax = {};
  static realFixer = { removeRange: () => "real" };
  report = () => {};
  constructor() {
    Object.freeze(this);
  }
  get fixer() {
    return StubContext.realFixer;
  }
  get Syntax() {
    return StubContext.syntax;
  }
}

test("withoutFix は options を linter に転送し、fixer を no-op にする", () => {
  let seen: { context: unknown; options: unknown } | undefined;
  const stub = (context: unknown, options?: unknown) => {
    seen = { context, options };
    return {};
  };
  const wrapped = withoutFix(stub) as (context: unknown, options?: unknown) => unknown;

  const context = new StubContext();

  wrapped(context, { dummy: true });

  assert.deepEqual(seen?.options, { dummy: true });
  const wrappedContext = seen?.context as {
    fixer: { removeRange: (...args: unknown[]) => unknown };
    Syntax: unknown;
    report: unknown;
  };
  assert.deepEqual(wrappedContext.fixer.removeRange(0, 1), undefined);
  assert.equal(wrappedContext.Syntax, StubContext.syntax);
  assert.deepEqual(typeof wrappedContext.report, "function");
});

test("proofdict の options には dictGlob が含まれず dictURL を持つ", () => {
  const proofdictConfig = rulesConfig.proofdict as Record<string, unknown>;
  assert.deepEqual("dictGlob" in proofdictConfig, false);
  assert.notDeepEqual(proofdictConfig.dictURL, undefined);
});

function extractSpecifiers(source: string): string[] {
  return [...source.matchAll(/\b(?:from|import)\s+"([^"]+)"|import\(\s*"([^"]+)"\s*\)/g)].map(
    (m) => m[1] ?? m[2],
  );
}

test("deps.ts の import specifier は package.json の dependencies と一致する", async () => {
  const depsSource = await readFile(new URL("./deps.ts", import.meta.url), "utf8");
  const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8")) as {
    dependencies: Record<string, string>;
  };
  const specifiers = extractSpecifiers(depsSource).sort();
  assert.deepEqual(specifiers, Object.keys(pkg.dependencies).sort());
});

test("@textlint/kernel での lint 統合", async (t) => {
  const kernel = new TextlintKernel();

  // ネットワークアクセスが発生する proofdict と、無効化済み (rulesConfig === false)
  // のルールを除いた全ルールを options 付きで kernel に渡す。
  const kernelRules = Object.keys(rules)
    .filter((key) => key !== "proofdict")
    .filter((key) => (rulesConfig as Record<string, unknown>)[key] !== false)
    .map((key) => ({
      ruleId: key,
      rule: (rules as Record<string, unknown>)[key] as any,
      options: (rulesConfig as Record<string, unknown>)[key],
    }));

  await t.test("である調と半角カナが混在する文でルールが検出される", async () => {
    const dirtyText = `# テスト

これはテストです。これは である調の文である。
半角カナﾃｽﾄを書く。
`;

    const result = await kernel.lintText(dirtyText, {
      ext: ".md",
      filePath: "test.md",
      plugins: [{ pluginId: "markdown", plugin: markdownPlugin as any }],
      rules: kernelRules as any,
    });

    const ruleIds = new Set(result.messages.map((m) => m.ruleId));
    assert.deepEqual(ruleIds.has("no-mix-dearu-desumasu"), true);
    assert.deepEqual(ruleIds.has("no-hankaku-kana"), true);
  });

  await t.test("見出し末尾の句点が 1.1.2.見出し で検出される", async () => {
    const dirtyText = `# 見出しである。

本文である。
`;

    // 見出し末尾の句点が検出され、message に fix が含まれず (autofix が
    // 効かない)、fixText でもテキストが変化しないことを確認する。
    const options = {
      ext: ".md",
      filePath: "test3.md",
      plugins: [{ pluginId: "markdown", plugin: markdownPlugin as any }],
      rules: kernelRules as any,
    };

    const result = await kernel.lintText(dirtyText, options);

    const ruleIds = new Set(result.messages.map((m) => m.ruleId));
    assert.deepEqual(ruleIds.has("1.1.2.見出し"), true);

    const headingMessage = result.messages.find((m) => m.ruleId === "1.1.2.見出し");
    assert.deepEqual(headingMessage?.fix, undefined);
    assert.deepEqual(headingMessage?.message.includes("句点"), true);

    // autofix (句点の削除) が効かないことを fixText でも確認する。
    const fixResult = await kernel.fixText(dirtyText, options);
    assert.deepEqual(fixResult.output, dirtyText);
  });

  await t.test("である調で統一された整った文は 0 件になる", async () => {
    const cleanText = `# テスト

これはテストである。
`;

    const result = await kernel.lintText(cleanText, {
      ext: ".md",
      filePath: "test2.md",
      plugins: [{ pluginId: "markdown", plugin: markdownPlugin as any }],
      rules: kernelRules as any,
    });

    assert.deepEqual(result.messages.length, 0);
  });

  await t.test("太字ラベルの箇条書きは検出されず、絵文字装飾の箇条書きは検出される", async () => {
    const dirtyText = `# テスト

- **ラベル**: 説明である。
- ✅ 完了である。
`;

    const result = await kernel.lintText(dirtyText, {
      ext: ".md",
      filePath: "test4.md",
      plugins: [{ pluginId: "markdown", plugin: markdownPlugin as any }],
      rules: kernelRules as any,
    });

    const listFormattingMessages = result.messages.filter(
      (m) => m.ruleId === "no-ai-list-formatting",
    );
    assert.deepEqual(
      listFormattingMessages.some((m) => m.line === 3),
      false,
    );
    assert.deepEqual(
      listFormattingMessages.some((m) => m.line === 4),
      true,
    );
  });
});
