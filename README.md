# textlint-rule-preset-ansanloms

以下 5 つの textlint preset / rule パッケージの `rules` / `rulesConfig` を 1 段にフラット化し、`ansanloms/openapi-template` の `.textlintrc.js` で使っていた options 上書きをあらかじめ適用した textlint preset。

- [textlint-rule-preset-ja-technical-writing](https://github.com/textlint-ja/textlint-rule-preset-ja-technical-writing)
- [textlint-rule-preset-ja-spacing](https://github.com/textlint-ja/textlint-rule-preset-ja-spacing)
- [textlint-rule-preset-jtf-style](https://github.com/textlint-ja/textlint-rule-preset-JTF-style)
- [@textlint-ja/textlint-rule-preset-ai-writing](https://github.com/textlint-ja/textlint-rule-preset-ai-writing)
- [@proofdict/textlint-rule-proofdict](https://github.com/proofdict/proofdict/tree/master/packages/@proofdict/textlint-rule-proofdict)

textlint は preset の入れ子 (ある preset の `rules` の中に別の preset を書くこと) をサポートしないため、この preset はビルド時ではなく `index.ts` の中で上記 5 パッケージの `rules` / `rulesConfig` を展開し、1 つの `{ rules, rulesConfig }` として export する。

deno で開発し、npm / JSR には publish しない。配布物はタグ打ちした `index.ts` + `deps.ts` + `deps/` 以下の各パッケージの再 export ファイル (5 パッケージをそれぞれ `npm:` specifier で import する自己完結ファイル群) で、jsDelivr 経由で直接 import して利用する (「使い方」参照)。相対 import はタグ付けした `index.ts` を基準に解決される。`deps/` 以下は `npm:` specifier に依存するため deno 専用であり、Node では利用できない。

## 含まれるルール

フラット化後のルール数は 77 個 (ja-technical-writing 23 + ja-spacing 11 + jtf-style 37 + ai-writing 5 + proofdict 1)。個々のルールの説明は各パッケージのリポジトリを参照。

この preset で `rulesConfig` に加えている options 上書きは次のとおり。

| preset               | ルール                                 | 上書き内容                                                                                   |
| -------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| ja-technical-writing | `sentence-length`                      | `{ max: 600 }`                                                                               |
| ja-technical-writing | `max-kanji-continuous-len`             | `{ max: 15 }`                                                                                |
| ja-technical-writing | `no-mix-dearu-desumasu`                | `{ preferInBody: "である", preferInHeader: "である", preferInList: "である", strict: true }` |
| ja-technical-writing | `ja-no-weak-phrase`                    | `false` (無効化)                                                                             |
| ja-technical-writing | `no-doubled-joshi`                     | `false` (無効化)                                                                             |
| ja-technical-writing | `ja-no-mixed-period`                   | `{ forceAppendPeriod: true }`                                                                |
| ja-spacing           | `ja-space-between-half-and-full-width` | `{ space: "always" }`                                                                        |
| ja-spacing           | `ja-space-around-code`                 | `{ before: true, after: true }`                                                              |
| ja-spacing           | `ja-space-around-link`                 | `{ before: true, after: true }`                                                              |
| jtf-style            | `1.1.1.本文`                           | `false` (無効化)                                                                             |
| jtf-style            | `1.1.3.箇条書き`                       | `false` (無効化)                                                                             |
| jtf-style            | `2.1.5.カタカナ`                       | `false` (無効化)                                                                             |
| jtf-style            | `3.1.1.全角文字と半角文字の間`         | `false` (無効化)                                                                             |
| jtf-style            | `4.2.6.ハイフン(-)`                    | `false` (無効化)                                                                             |
| jtf-style            | `4.2.7.コロン(：)`                     | `false` (無効化)                                                                             |
| jtf-style            | `4.3.1.丸かっこ（）`                   | `false` (無効化)                                                                             |
| jtf-style            | `4.3.2.大かっこ［］`                   | `false` (無効化)                                                                             |
| jtf-style            | `4.3.7.山かっこ<>`                     | `false` (無効化)                                                                             |
| ai-writing           | `no-ai-list-formatting`                | `false` (無効化)                                                                             |
| proofdict            | `proofdict`                            | `{ dictURL: "https://azu.github.io/proof-dictionary/", autoUpdateInterval: 1000 }`           |

`1.1.2.見出し` は `rulesConfig` の値 (upstream 既定の `true`) を変えず有効のままにしつつ、autofix だけを抑止している。このルールは見出し末尾の句点を検出するが、`--fix` では消させたくないため、`index.ts` が rule に渡す `context` の `fixer` を no-op に差し替えたラッパーで包んでいる (`rulesConfig` の値は変えていないので、上の一覧には出てこない)。

以下は主な上書きの根拠。

`1.1.1.本文` を無効化しているのは、文体は `no-mix-dearu-desumasu` が唯一決めるという方針のため。`1.1.1.本文` は多数決で敬体を要求することがあり、`no-mix-dearu-desumasu` と矛盾する指摘を出す。

JTF の `4.3.1.丸かっこ` / `4.3.2.大かっこ` / `4.2.7.コロン` は半角記号を検出して全角を要求し、`4.2.6.ハイフン` は日本語に接する半角ハイフンを禁止する rule。記号類は半角に統一する方針のため無効化する。`4.3.7.山かっこ` は幅を見ず半角 `<>` の対応だけを見る rule で、方針に寄与しないため無効のまま。全角記号が混入したときに検出して半角へ直す手段はこの preset に無く、後続で追加する。

`ja-no-weak-phrase` を無効化しているのは、推量・反実仮想・不確実性の明示を機械的に消さないため。根拠の無い緩和表現の除去は文脈で判定する必要があり、それは推敲側の責務とする。

`sentence-length` の `max: 600` は、1 行 = 1 項目 = 1 文になる仕様文 (括弧補足込み) を通すための上限で、目安ではなく超長文だけを止めるための値。文を分割すべきかどうかの判断 (一文一義) は推敲側が持つ。

`ai-tech-writing-guideline` は有効のまま。ai-writing 側の既定は `{ severity: "info" }` だが、このルールは textlint の severity 指定が効かない実装 (report に `TextlintRuleError` ではなく plain object を渡す) のため、実際には error として報告される。advisory 扱いにしたい場合は利用側で `"ai-tech-writing-guideline": false` として無効化する。

`proofdict` の元設定 (openapi-template) には消費側 cwd 相対の `dictGlob` (独自辞書ファイルの指定) も含まれていたが、preset 側は消費側のファイル構成に依存できないため、この preset には含めない。必要な場合は利用側で options を丸ごと置換して追加する (「設定の上書き」参照)。`autoUpdateInterval: 1000` は openapi-template で使っていた値をそのまま引き継いでいる。

`2.1.5.カタカナ` は JTF 外来語辞書が「プラットホーム」「インターフェイス」「フォルダー」のような長音を要求し、長音を省略する技術文書の慣行と逆のため無効のまま (upstream 既定も false)。

`no-ai-list-formatting` は「**ラベル**: 説明」の形の箇条書きを許容する方針のため無効化。

## 使い方 (Deno)

textlint はルールパッケージを `require.resolve` で解決し、import map (`deno.json` の `imports`) を見ない。そのため deno の import map で疑似的に `textlint-rule-preset-ansanloms` という名前を用意しても textlint 側からは見つけられない。この preset は `--rules-base-directory <絶対パス>` で指定したディレクトリの下に `textlint-rule-preset-ansanloms/index.js` という実ファイルを置くことで解決させる。`--rules-base-directory` に相対パスを渡すと `./` が落ちて裸のパッケージ名として扱われ、`== No rules found, textlint hasn't done anything ==` と表示されて終了コード 1 で終わる。このメッセージはパスが原因であることを示さないため、必ず絶対パスを渡すこと。

消費側の `deno.json` に、この preset の import map エントリを追加する。依存パッケージは `deps/**/mod.ts` が `npm:` specifier で解決するため (`deps.ts` はそれらを相対 import で集約するだけ)、消費側で個別のバージョンを指定する必要はない。

```json
{
  "imports": {
    "textlint": "npm:textlint@15.8.0",
    "@ansanloms/textlint-rule-preset-ansanloms": "https://cdn.jsdelivr.net/gh/ansanloms/textlint-rule-preset-ansanloms@0.0.2/index.ts"
  }
}
```

`textlint/textlint-rule-preset-ansanloms/index.js`:

```js
export { default } from "@ansanloms/textlint-rule-preset-ansanloms";
```

`.textlintrc.js`:

```js
module.exports = {
  rules: {
    "preset-ansanloms": true,
  },
};
```

textlint を実行するタスク (`deno.json`) では `--rules-base-directory` に上記の `textlint/` ディレクトリを絶対パスで渡す。

```json
{
  "tasks": {
    "textlint": {
      "description": "Run textlint command",
      "command": "deno --quiet run --allow-env --allow-read --allow-sys --allow-write --allow-net textlint --rules-base-directory $INIT_CWD/textlint"
    }
  }
}
```

`$INIT_CWD` は `deno task` を起動したシェルの cwd を指す。プロジェクトルートで直接 `deno task` を起動する場合は `$INIT_CWD` でよいが、サブディレクトリから起動すると rules base の解決に失敗する。`deno task --cwd <dir>` で別ディレクトリの `deno.json` を使う場合、`$INIT_CWD` は `--cwd` の値ではなく起動元のシェルの cwd になるため、`--rules-base-directory $PWD/textlint` のように `$PWD` (この場合 `--cwd` の値) を使うこと。

`import` すると proofdict の保存先 `.cache/` (`kvs-node-localstorage`) が生成される。生成先は環境により異なり、cwd に出る場合 (テストや直接実行) と Deno の npm キャッシュ内に出る場合 (`npm:` 経由の `deno task --cwd` 実行で実測) がある。cwd に出たときにコミットしないよう、予防的に `.gitignore` に `.cache/` を入れておく。

具体例は `examples/` を参照。

### トラブルシュート

`== No rules found, textlint hasn't done anything ==` (終了コード 1) が出る場合、textlint は preset のロード失敗を握り潰してこう表示する。原因は次のいずれかであることが多い: (a) `--rules-base-directory` が相対パス、(b) ラッパーディレクトリ名やファイル名の誤り、(c) import map の alias の URL に到達できない (タグ未作成、ネットワーク不通)。切り分けは、alias の URL を `curl` 等で直接取得できるか確認し、`deno eval 'import("<alias>")'` 相当でラッパーを直接 import してエラーを表示させる (textlint 経由では見えない)。

## 設定の上書き

textlint はユーザ設定側の options を preset の既定値と「マージ」ではなく「置換」で適用する。個別ルールの options を上書きしたい場合は、`.textlintrc.js` の `rules` にそのルールの options を丸ごと書き直す。

たとえば `proofdict` に独自辞書 (`dictGlob`) を追加しつつ `dictURL` は維持し、`no-doubled-joshi` を再度有効化する場合は次のようになる。

```js
module.exports = {
  rules: {
    "preset-ansanloms": {
      proofdict: {
        dictURL: "https://azu.github.io/proof-dictionary/",
        autoUpdateInterval: 1000,
        dictGlob: "./dict/*.yaml",
      },
      "no-doubled-joshi": {},
    },
  },
};
```

`proofdict` は `dictGlob` だけを追記するのではなく `dictURL` / `autoUpdateInterval` も含めて書き直している点に注意。置換なので、書かなかったフィールドはこの preset の既定値ではなく単に消える。

`no-doubled-joshi` のようにこの preset が `false` (無効化) にしているルールを再有効化する場合、`true` ではなく options オブジェクト (既定値でよければ `{}`) を渡す必要がある。textlint の config-loader はユーザ設定側の `true` を preset 側の `rulesConfig` の値 (ここでは `false`) に置き換えてしまうため、`true` を書いても無効化されたままになる。

同じ理由で、upstream の preset が既定で無効にしている rule を消費側の `.textlintrc` で `"preset-jtf-style": { "2.1.5.カタカナ": true }` のように `true` にしても有効にならない (textlint は `true` を preset 側の既定値に置き換える)。この preset は平坦化後の値を焼き込んでいるため、この preset の `rulesConfig` で `false` になっている rule を再有効化するときも上記と同じく options オブジェクト (`{}`) を渡す。

## 開発

```sh
deno task test    # テスト (coverage 付き)
deno task check   # 型チェック
deno task lint    # deno lint && deno fmt --check
deno task fix     # deno lint --fix && deno fmt
```

この preset がフラット化する 5 パッケージは `deps.ts` に直接バージョンを書かず、1 パッケージ 1 ファイルで `deps/<パッケージ名>/mod.ts` に `npm:` specifier での再 export として置く (例: `deps/textlint-rule-preset-ja-technical-writing/mod.ts`)。`deps.ts` はこれらのファイルを import して集約し、CJS/ESM 相互運用のネストを剥がすだけで、バージョン自体は持たない。

外部依存のうち、`deno.json` の `imports` (テスト用の依存 `@std/assert`, `@textlint/kernel`, `@textlint/textlint-plugin-markdown`) と `examples/deno.json` の `textlint` は Dependabot が管理する (`.github/dependabot.yml`)。手動で更新する場合は `deno outdated --update` (Deno 2.1 以降の組み込みコマンド) を使う。`examples/` は workspace のメンバーではなく独自の `deno.json` / `deno.lock` を持つため、`examples/` に移動して同じコマンドを実行する必要がある。lint plugin (`jsr:@aireone/deno-lint-curly`。ルートと `examples/deno.json` の両方の `deno.json` にバージョンを固定) は Dependabot からも molt からも管理されないため、両方の `deno.json` を手で書き換える。

### 依存の更新

`deps/<パッケージ名>/mod.ts` のバージョンを上げる手順は次のとおり。

1. `deno task update` で更新候補を確認する (書き換えは行わない)。
2. `deno task update:write` で `deps/**/mod.ts` を書き換える。
3. `rm -f deno.lock examples/deno.lock` で両方の lockfile を削除してから `deno task check` を実行する (`deno.lock` が再生成される)。lock を残したまま再生成すると旧版のエントリが消えずに残り続ける。
4. `deno task test` を実行する。
5. `deno task lint` を実行する (lint plugin の lock エントリはこれで入る)。
6. `cd examples && deno install` を実行する (`examples/deno.lock` が再生成される)。
7. `git status` で変更が `deps/**/mod.ts`, `deno.lock`, `examples/deno.lock` のみであることを確認してからコミットする (`build(deps): ...`)。

`deno task update` / `deno task update:write` は [molt](https://jsr.io/@molt/cli) (`0.19.8` に固定) に `deps/**/mod.ts` を直接指定して実行する。molt は `index.ts` からの相対 import を辿らないため、更新対象のファイルを明示的に渡す必要がある。また molt は Deno 2 の lockfile (v5) を読めず、素の状態で実行すると molt 自身の依存 (`@molt/cli` 等) がプロジェクトの `deno.lock` に混入してしまうため、`--no-lock` を付けて lockfile への書き込みを止めている。`deno.lock` は上記手順の 3 (`deno task check`) で改めて再生成する。

`examples/deno.lock` の npm 系エントリは `examples/deno.json` の直接の `imports` ではなく `index.ts` (経由の `deps.ts`、`deps/**/mod.ts`) から解決されるため、依存バージョンの更新は `examples/deno.lock` にも反映が必要になる。

### CI

`.github/workflows/ci.yml` は pull request と main への push で実行し、lint / check / test に加え、`examples/` でのスモークテスト (`no-mix-dearu-desumasu` の検出を確認する。proofdict は辞書をネット越しに取得し断続的に 0 件になるため、proofdict の検出結果は断言しない)、working tree に差分が残っていないかの確認、README のバージョン記載が `deno.json` の `version` と一致しているかの確認を行う。

`.github/workflows/update-deps.yml` は手動起動 (`workflow_dispatch`) のみ。molt で `deps/**/mod.ts` を更新し、`deps/` に差分が無ければそこで終了する。差分があれば lockfile を再生成し、`deno ci` とスモークテストを通したうえで `create-pull-request` によりブランチ `molt/update-deps` へ PR を作成する。この PR は `GITHUB_TOKEN` で作成されるため CI が自動起動しない (close してから reopen するか、ブランチに手動で push すると起動する)。また `create-pull-request` が PR を作成するには、リポジトリ設定で "Allow GitHub Actions to create and approve pull requests" を有効にしておく必要がある。初回起動で push できない場合は 2 job 構成に切り替える予定。

## リリース手順

1. `deno.json` の `version` を更新する。同時に、この README の「使い方 (Deno)」の import map の例にある `@ansanloms/textlint-rule-preset-ansanloms` の jsDelivr URL (`@<バージョン>/index.ts`) も同じバージョンに更新する。古いバージョンのまま残すと、コピー & ペーストした利用者が古いタグを参照し続けることになる。
2. `deno task lint` / `deno task check` / `deno task test` と、`examples/` で `deno task textlint .` が想定どおり動くことをローカルで確認する。
3. 同じ値でタグを打って push する。

タグを打つと jsDelivr の `@<バージョン>` 指定 (上記の import map 参照) から新しいバージョンの `index.ts`、`deps.ts`、`deps/**/mod.ts` (いずれもタグ付けした `index.ts` を基準にした相対パスで fetch される) を取得できるようになる。この preset は npm / JSR に publish しないため、GitHub Release は作らない。

## ライセンス

MIT
