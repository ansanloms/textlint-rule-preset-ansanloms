# textlint-rule-preset-ansanloms

ansanloms 用の textlint rule preset。`textlint-rule-preset-ja-technical-writing`、`textlint-rule-preset-jtf-style`、`textlint-rule-preset-ja-spacing`、`@textlint-ja/textlint-rule-preset-ai-writing`、`@proofdict/textlint-rule-proofdict` を束ね、`index.ts` の overrides で一部ルールの設定を上書きする。

npm には publish せず、GitHub のタグを git 依存で参照する。

## 使い方

```sh
npm install -D github:ansanloms/textlint-rule-preset-ansanloms#0.1.0
```

`.textlintrc.js` の例。

```js
module.exports = {
  rules: {
    "@ansanloms/preset-ansanloms": true,
  },
};
```

動作する例は [`examples/`](./examples) を参照。

## 設定の上書き

`index.ts` の overrides で次のルールの設定を上書きしている。

- `sentence-length`: `max` を 600 にする。
- `max-kanji-continuous-len`: `max` を 15 にする。
- `no-mix-dearu-desumasu`: 本文・見出し・箇条書きともに「である」調を優先し、`strict` を有効にする。
- `ja-no-weak-phrase`、`no-doubled-joshi`: 無効化する。
- `ja-no-mixed-period`: `forceAppendPeriod` を有効にする。
- `ja-space-between-half-and-full-width`: `space` を `always` にする。
- `ja-space-around-code`、`ja-space-around-link`: 前後に空白を要求する。
- JTF スタイルの `1.1.1.本文`、`1.1.3.箇条書き`、`2.1.5.カタカナ`、`3.1.1.全角文字と半角文字の間`、`4.2.6.ハイフン(-)`、`4.2.7.コロン(：)`、`4.3.1.丸かっこ（）`、`4.3.2.大かっこ［］`、`4.3.7.山かっこ<>`: 無効化する。
- `1.1.2.見出し`: 有効のまま、autofix だけを無効化する (検出のみ行う)。
- `proofdict`: `dictURL` に `https://azu.github.io/proof-dictionary/` を指定する。
- `no-ai-list-formatting`: `disableBoldListItems` を有効にする。

textlint は利用側の options を「マージ」ではなく「置換」で適用する。個別ルールを上書きする場合は、そのルールの options を丸ごと書き直す。

```js
module.exports = {
  rules: {
    "@ansanloms/preset-ansanloms": {
      "sentence-length": { max: 300 },
    },
  },
};
```

### proofdict

`dictGlob` (利用側の cwd 相対の辞書ファイル) は preset に含まれない。追加する場合は利用側の `.textlintrc.js` で `proofdict` のオプションを書く。オプションは丸ごと置き換わるため、preset が設定している `dictURL` と `autoUpdateInterval` も必要なら一緒に書く。

```js
module.exports = {
  rules: {
    "@ansanloms/preset-ansanloms": {
      proofdict: {
        dictURL: "https://azu.github.io/proof-dictionary/",
        autoUpdateInterval: 1000,
        dictGlob: ["./dict/*.yml"],
      },
    },
  },
};
```

## 注意

`proofdict` は `dictURL` でネットワークから辞書を取得する。

## 開発

```sh
npm ci
npm test
npm run check
npm run lint
npm run fix
npm run compile
```

`dist/` は tsc の出力である。ソースを変えたら `npm run compile` を実行してコミットする。CI が `dist/` の鮮度を検査する。

`.cache/` は proofdict の辞書キャッシュで、git 管理外である。

Node 24 は開発環境の要件 (`.node-version`) で、配布物は素の ESM なので利用側に Node 24 を要求しない。

`package.json` に `build` / `prepare` 等の lifecycle script を置かない。git 依存として install されるときに npm がビルドを走らせ、利用側で失敗するため。

## 依存の更新

Dependabot (npm) が `package.json` と lockfile を更新する。rule パッケージの更新で `rules` の数が変わるとテスト (77 件) が落ちるので、その PR でテストの期待値と overrides を見直す。

5 つの rule パッケージ (`textlint-rule-preset-ja-technical-writing`、`textlint-rule-preset-jtf-style`、`textlint-rule-preset-ja-spacing`、`@textlint-ja/textlint-rule-preset-ai-writing`、`@proofdict/textlint-rule-proofdict`) は正確な版で固定している。git 依存で install する利用者はこの repo の lockfile を読まないため、CI で検証した版だけを配る必要がある。更新は Dependabot の PR で CI (rules 件数のテスト) を通してから取り込む。

devDependencies も含め全依存を正確な版で固定している (`.npmrc` の `save-exact`)。
`ignore-scripts` で install 時に依存の lifecycle script を実行しない (`npm run` の本体 script には影響しない)。`min-release-age` で公開から 7 日未満の版を新規に解決しない (lockfile に固定済みの版には効かない)。

Dependabot の `typescript` 更新で `dist/` の出力が変わり鮮度検査が落ちた場合は、PR ブランチで `npm run compile` を実行して `dist/` をコミットする。

### リリース手順

1. `npm version <version> --no-git-tag-version` で `package.json` と `package-lock.json` を更新し、`cd examples && npm install` で `examples/package-lock.json` も更新し、`npm run compile` して全部コミットする。
2. 同じ値でタグを打って push する。

GitHub Release は作らない。

## ライセンス

MIT
