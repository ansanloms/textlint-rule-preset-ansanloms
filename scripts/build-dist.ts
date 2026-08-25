// index.ts は Dependabot が更新できるよう bare specifier (deno.json の imports
// で解決する形) のまま保つ。一方、この preset を消費する側の import map には
// この preset が依存する 5 パッケージを個別に書かせたくない (消費側のバージョンと
// この preset のバージョンがずれると、フラット化される rules のキー一覧が変わり
// うるため)。
//
// そこで、消費側には `npm:` specifier だけで自己完結した dist/index.ts を配布する。
// `deno bundle` を使わないのは、依存先 (kuromoji の辞書ファイル読み込みや、
// 一部の transitive dependency が使う `__dirname`) が単一ファイルへの bundle と
// 相性が悪いため。代わりに、index.ts のテキストのうち `imports` に対応する
// bare specifier だけを、その値 (`npm:pkg@version`) へ文字列置換する。
//
// 生成結果は git 管理し (`.gitignore` に追加しない)、CI で
// `deno task build` の再実行結果が差分無しであることを検証する。

const ROOT = new URL("../", import.meta.url);
const DENO_JSON_PATH = new URL("./deno.json", ROOT);
const INDEX_TS_PATH = new URL("./index.ts", ROOT);
const DIST_DIR = new URL("./dist/", ROOT);
const DIST_INDEX_TS_PATH = new URL("./index.ts", DIST_DIR);

const HEADER =
  "// Generated from index.ts by `deno task build`. Do not edit; edit index.ts and rebuild.\n\n";

type DenoJson = {
  imports?: Record<string, string>;
};

const denoJson: DenoJson = JSON.parse(await Deno.readTextFile(DENO_JSON_PATH));
const imports = denoJson.imports ?? {};

let source = await Deno.readTextFile(INDEX_TS_PATH);

for (const [specifier, target] of Object.entries(imports)) {
  if (!target.startsWith("npm:")) {
    continue;
  }
  source = source.replaceAll(`from "${specifier}"`, `from "${target}"`);
  source = source.replaceAll(`import "${specifier}"`, `import "${target}"`);
  source = source.replaceAll(
    `import("${specifier}")`,
    `import("${target}")`,
  );
}

const specifierPattern =
  /\b(?:from|import)\s+"([^"]+)"|import\(\s*"([^"]+)"\s*\)/g;
const offenders: string[] = [];
for (const match of source.matchAll(specifierPattern)) {
  const value = match[1] ?? match[2];
  if (!value.startsWith("npm:")) {
    offenders.push(value);
  }
}
if (offenders.length > 0) {
  console.error(
    `build-dist: found non-"npm:" specifiers in generated dist: ${
      offenders.join(", ")
    }`,
  );
  Deno.exit(1);
}

await Deno.mkdir(DIST_DIR, { recursive: true });
await Deno.writeTextFile(DIST_INDEX_TS_PATH, HEADER + source);
