# topic-286 検証ログ（独立査読）

注: WebFetchは全ドメインで接続不可。WebSearchの要約・抜粋で確認（原文直接閲覧は未実施）。

| 主張 | 確認できた根拠（自分の言葉で1行） | 出典URL | 判定 |
|---|---|---|---|
| Evan Miller記事の存在 | "How Not To Run an A/B Test"（2010年4月）として存在 | https://www.evanmiller.org/how-not-to-run-an-ab-test.html | OK |
| 繰り返し確認すると偽陽性が増える（繰り返し有意性検定の誤り） | 記事が"repeated significance testing errors"として警告 | https://www.evanmiller.org/how-not-to-run-an-ab-test.html | OK |
| 26.1％（最悪ケース、観測のたびに検定） | 検索結果で記事の文言「最悪26.1%、観測のたびに検定する場合」を確認（5%水準での前提は抜粋に明示なし） | https://www.evanmiller.org/how-not-to-run-an-ab-test.html | OK |
| 10回のぞくと1％のつもりが実際は5％ | 記事に "peek ... ten times, then what you think is 1% significance is actually just 5%" と明記 | https://www.evanmiller.org/how-not-to-run-an-ab-test.html | OK |
| 事前にサンプル数を決め、終わるまで信じない | 記事の推奨と一致 | https://www.evanmiller.org/how-not-to-run-an-ab-test.html | OK |
| Johari et al. KDD 2017 "Peeking at A/B Tests" | 出典として掲載のみ。本文での個別数値主張なし | https://dl.acm.org/doi/10.1145/3097983.3097992 | OK |
| 途中経過は異常検知のため（e） | 記事の主張ではなく一般的助言。本文に断定なし。許容 | - | OK |
| Q5（推論, hyp:true） | 推論として明示 | - | OK |

## 総合判断
- 文言コピー: なし。
- 正解数: 各問ちょうど1つ。
- 目立ち: Q5とQ4で正解だけ長く具体的。書き換え推奨。
- 判定: passed（Q4・Q5の選択肢修正を条件）。
