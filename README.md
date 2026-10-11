# ナゼトレ

マーケティングの「なぜ」を毎日5問で鍛えるPWA。オフラインで動く（問題データは端末に保存）。

- 公開URL: https://rinnok.github.io/nazetore/
- 問題の追加: `data/themes.json` の `themes` に1テーマ（5問）を足し、`updated` を変えて push
- 1テーマの型: 事実 → 顧客 → なぜ → 打ち手 → 自分ならどうする（`"hyp": true` で仮説入力を必須化）
- 数字は必ず `sources` の一次情報と照合してから載せる。理由づけが推論なら解説に「推論」と明記
- アプリ本体を変えたら `sw.js` の `VERSION` を上げる
