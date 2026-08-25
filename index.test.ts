import { assertEquals, assertNotEquals } from "@std/assert";
import { TextlintKernel } from "@textlint/kernel";
import markdownPluginMod from "@textlint/textlint-plugin-markdown";
import { rules, rulesConfig, sources } from "./index.ts";

// CJS/ESM 相互運用で default export が `{ default: { Processor } }` の形で
// 1 段ネストされるため、テストでも `.default` を 1 段剥がす。
const markdownPlugin = (markdownPluginMod as { default?: unknown }).default ??
  markdownPluginMod;

function isRuleValue(value: unknown): boolean {
  return typeof value === "function" ||
    (typeof value === "object" && value !== null &&
      ("linter" in value || "fixer" in value));
}

Deno.test("rules は 5 パッケージ分をフラット化した 77 個を持つ", () => {
  assertEquals(Object.keys(rules).length, 77);
});

Deno.test("rules のキー数はフラット化元 4 パッケージの rules 数 + proofdict の合計と一致する", () => {
  // Object.keys(rules).length だけを見ると、フラット化元のキーが偶然重複して
  // spread で上書き (shadowing) された場合もルール総数が同じに見えてしまい
  // 検出できない。各パッケージの rules 数を個別に積算した期待値と突合することで、
  // そのような衝突を検出する。
  const expected = Object.values(sources).reduce(
    (n, s) => n + Object.keys(s.rules).length,
    0,
  ) + 1; // +1 は proofdict
  assertEquals(Object.keys(rules).length, expected);
});

Deno.test("rulesConfig のキー集合は rules のキー集合と一致する", () => {
  const ruleKeys = new Set(Object.keys(rules));
  const configKeys = new Set(Object.keys(rulesConfig));
  assertEquals(configKeys, ruleKeys);
});

Deno.test("rules の各値は関数、または linter/fixer を持つオブジェクトである", () => {
  for (const [key, value] of Object.entries(rules)) {
    assertEquals(isRuleValue(value), true, `rules.${key} の形が不正`);
  }
});

Deno.test("openapi-template 由来の options 上書きが反映されている", () => {
  assertEquals(
    (rulesConfig as Record<string, unknown>)["sentence-length"],
    { max: 600 },
  );
  assertEquals(
    (rulesConfig as Record<string, unknown>)["no-mix-dearu-desumasu"],
    {
      preferInBody: "である",
      preferInHeader: "である",
      preferInList: "である",
      strict: true,
    },
  );
  assertEquals(
    (rulesConfig as Record<string, unknown>)["no-doubled-joshi"],
    false,
  );
  assertEquals(
    (rulesConfig as Record<string, unknown>)["2.1.5.カタカナ"],
    true,
  );
  assertEquals(
    (rulesConfig as Record<string, unknown>)[
      "ja-space-between-half-and-full-width"
    ],
    { space: "always" },
  );
});

Deno.test("proofdict の options には dictGlob が含まれず dictURL を持つ", () => {
  const proofdictConfig = rulesConfig.proofdict as Record<string, unknown>;
  assertEquals("dictGlob" in proofdictConfig, false);
  assertNotEquals(proofdictConfig.dictURL, undefined);
});

Deno.test("dist/index.ts の rules / rulesConfig は index.ts と一致する", async () => {
  const dist = (await import("./dist/index.ts")).default;
  assertEquals(
    new Set(Object.keys(dist.rules)),
    new Set(Object.keys(rules)),
  );
  assertEquals(dist.rulesConfig, rulesConfig);
});

Deno.test("dist/index.ts の import specifier はすべて npm: である", async () => {
  const distSource = await Deno.readTextFile(
    new URL("./dist/index.ts", import.meta.url),
  );
  const specifiers = [
    ...distSource.matchAll(
      /\b(?:from|import)\s+"([^"]+)"|import\(\s*"([^"]+)"\s*\)/g,
    ),
  ].map((m) => m[1] ?? m[2]);
  assertEquals(specifiers.length > 0, true);
  for (const specifier of specifiers) {
    assertEquals(
      specifier.startsWith("npm:"),
      true,
      `specifier "${specifier}" は npm: で始まっていない`,
    );
  }
});

Deno.test("@textlint/kernel での lint 統合", async (t) => {
  const kernel = new TextlintKernel();

  // ネットワークアクセスが発生する proofdict と、無効化済み (rulesConfig === false)
  // のルールを除いた全ルールを options 付きで kernel に渡す。
  const kernelRules = Object.keys(rules)
    .filter((key) => key !== "proofdict")
    .filter((key) => (rulesConfig as Record<string, unknown>)[key] !== false)
    .map((key) => ({
      ruleId: key,
      // deno-lint-ignore no-explicit-any
      rule: (rules as Record<string, unknown>)[key] as any,
      options: (rulesConfig as Record<string, unknown>)[key],
    }));

  await t.step(
    "である調と半角カナが混在する文でルールが検出される",
    async () => {
      const dirtyText = `# テスト

これはテストです。これは である調の文である。
半角カナﾃｽﾄを書く。
`;

      const result = await kernel.lintText(dirtyText, {
        ext: ".md",
        filePath: "test.md",
        plugins: [
          // deno-lint-ignore no-explicit-any
          { pluginId: "markdown", plugin: markdownPlugin as any },
        ],
        // deno-lint-ignore no-explicit-any
        rules: kernelRules as any,
      });

      const ruleIds = new Set(result.messages.map((m) => m.ruleId));
      assertEquals(ruleIds.has("no-mix-dearu-desumasu"), true);
      assertEquals(ruleIds.has("no-hankaku-kana"), true);
    },
  );

  await t.step("である調で統一された整った文は 0 件になる", async () => {
    const cleanText = `# テスト

これはテストである。
`;

    const result = await kernel.lintText(cleanText, {
      ext: ".md",
      filePath: "test2.md",
      plugins: [
        // deno-lint-ignore no-explicit-any
        { pluginId: "markdown", plugin: markdownPlugin as any },
      ],
      // deno-lint-ignore no-explicit-any
      rules: kernelRules as any,
    });

    assertEquals(result.messages.length, 0);
  });
});
