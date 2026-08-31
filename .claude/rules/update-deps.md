# 依存パッケージのバージョン更新

この preset がフラット化する 5 パッケージ (textlint-rule-preset-ja-technical-writing, textlint-rule-preset-ja-spacing, textlint-rule-preset-jtf-style, @textlint-ja/textlint-rule-preset-ai-writing, @proofdict/textlint-rule-proofdict) のバージョンを上げるときの手順。

## 対象

バージョンは `deps/<パッケージ名>/mod.ts` に 1 ファイル 1 パッケージで置く。各ファイルの中身は `npm:pkg@ver` の再 export 1 行のみ。`deno.json` の `imports` はテスト用依存 (`@std/assert` 等) のみを管理し、この 5 パッケージは書かない。

## 手順

README の「依存の更新」と同じ順序。README を正本とし、ここでは順序と注意点だけを再掲する。

1. `deno task update` で更新候補を確認する (書き換えは行わない)。
2. `deno task update:write` で `deps/**/mod.ts` を書き換える。
3. `deno task check` を実行する (`deno.lock` が再生成される)。
4. `deno task test` を実行する。
5. `cd examples && deno install` を実行する (`examples/deno.lock` が再生成される)。
6. `git status` で変更が `deps/**/mod.ts`, `deno.lock`, `examples/deno.lock` のみであることを確認してからコミットする (`build(deps): ...`)。

## 注意点

- molt は `deps/**/mod.ts` を直接引数に取る。`index.ts` からは辿らないため、更新対象のファイルを明示的に指定する必要がある。
- `deno task update` / `update:write` は `--no-lock` で起動する。molt は Deno 2 の lockfile (v5) を読めず、`--no-lock` を付けないと molt 自身の依存 (`@molt/cli` 等) がプロジェクトの `deno.lock` に混入してしまうため。lockfile は molt ではなく手順 3 (`deno task check`) / 手順 5 (`deno install`) で再生成する。
- `deno.lock` に `@molt` や `cliffy` 等が混入していたら誤り。`git checkout -- deno.lock` してから手順をやり直す。
- 版を上げるとフラット化後の rules のキー集合が変わりうる。`deno task test` の 77 件固定のテストが落ちたら、README のルール数と options 上書き表を見直す。
