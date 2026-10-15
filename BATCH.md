# ナゼトレ 一括生成ワーカーの手順（題材100本のストック作り）

`data/queue.json` の100題材を、10本ずつ問題化してストック（おかわり）に入れる。
1回の実行では **「作る」か「検証する」のどちらか一方だけ** を行う。作った回と検証する回を別の実行に分けることで、検証を独立させる。
問題の書き方・イラスト・数字の確認方法は GENERATE.md の 2〜3 に従う。

## 0. 開始時の確認（毎回）
1. `git pull origin main`
2. **ロック**：`data/batch.lock` があり、中の時刻が50分以内なら、何もせずに終了する。なければ現在時刻（UTC ISO）を書いて commit・push してから進む
3. 次の順で、やることを1つだけ決める
   - `themes` に `"review": "pending"` があれば → **B. 検証する**
   - なければ、`queue` に `"status": "pending"` があれば → **A. 作る**
   - どちらもなく、`data/batch-done.json` がなければ → **C. 完了報告**
   - どれでもなければ、ロックを消して終了

## A. 作る（10本）
1. `queue` で `status == "pending"` の番号が小さい順に10本を取る
2. 1本ずつテーマを作る（GENERATE.md の「1テーマの書き方」に従う）
   - `id`：`topic-<3桁の番号>`（例 `topic-007`）
   - `date`：`"stock"`／`kind`：queue の `kind`／`tags`：queue の `tags`（題材に合わなければ変えてよい）
   - `title`：queue の題目をそのまま使う（明らかに不適切なら直してよい）
   - `learn`：queue の `gain` を1文に
   - `review`：`"pending"`／`topicNo`：番号
   - 型：①事実 →②背景・顧客 →③なぜ →④打ち手・仕組み・結論 →⑤自分ならどうする（`"hyp": true`、マーケ・リサーチ系コンサルの実務や熱海DMOに引きつける）
   - 考え方（concept）の題材は、①を「よくある誤解」や「有名な実験・事例」にしてよい
   - **事実が確かめられない題材は作らない**。その queue の `status` を `"skipped"` にし、`note` に理由を書く
3. queue の `status` を `"generated"` にする
4. イラスト（`img/<id>.svg`）を作り、`sw.js` の `VERSION` を上げて `SHELL` に足す
5. `python scripts/validate.py` が OK になることを確認する
6. ロックを消し、commit（`batch: topic-xxx〜yyy を生成`）→ `git push origin HEAD:main`

## B. 検証する（独立レビュー）
**あなたは作った人ではない。厳しい査読者として、`"review": "pending"` のテーマを1本ずつ検証する。**

1. **答えを見ずに解く**：次のスクリプトで、答え（`a`）と解説（`e`）を隠した問題を表示し、自分で全問を解いてから照合する
   ```
   python3 -c "import json;[print(t['id'],i+1,q['q'],q['o']) for t in json.load(open('data/themes.json'))['themes'] if t.get('review')=='pending' for i,q in enumerate(t['questions'])]"
   ```
   - 自分の答えと `a` が違う問題は、どちらが正しいかを出典で判断し、`a` を直すか、選択肢を「正解が1つだけ」になるように書き直す
   - 2つ以上の選択肢が正解と言える問題も同じく直す（5問目の「自分ならどうする」は、模範解答が他より明らかに筋がいいこと）
2. **事実の確認**：問題文・選択肢・解説にある数字・年・固有名詞・「世界初」などの主張に加え、**「どうやって作った／なぜそうなった」という仕組み・因果の記述（正解の選択肢は特に）**も全部書き出し、1つずつ WebSearch（mode: extended）で確認する。確認した結果は `data/review-log/<id>.md` に「主張｜確認できた根拠（自分の言葉で1行）｜出典URL｜判定（OK／修正／削除）」の表で残す。出典URLと対応が取れないものは、削除するか確認できた表現に直す。`sources` も実際に確認できたものに合わせる
3. **著作権**：記事・書籍の文章をそのまま写した箇所がないか。あれば自分の言葉に書き直す
4. **答えがバレないか**：正解の選択肢だけが長い・具体的・丁寧になっていないか。3つの選択肢の長さと具体性をそろえ、誤答も「ありそうだが違う」内容にする。選択肢に「（推論）」などの注記を書かない（注記は解説に書く）
5. **わかりやすさ**：問題文が1回読んで分かるか、解説が「なぜ」に答えているか、トーンが既存テーマと合っているか
6. 判定を書く
   - 合格（直したものを含む）：`"review": "passed"`、`"reviewNote"` に「直した点」を1文
   - 直しても成り立たない：`"review": "rejected"`、`reviewNote` に理由。queue の該当番号の `status` も `"rejected"`
7. **既存テーマの手直し**：`python scripts/validate.py` の WARN に出ているテーマ（review が無い・passed のもの）を最大3本選び、4. の基準で選択肢を書き直す（正解の内容と番号は変えない）
8. `python scripts/validate.py` が OK になることを確認する
9. ロックを消し、commit（`review: topic-xxx〜yyy を検証（合格n・差し戻しm）`）→ `git push origin HEAD:main`
10. Slack `#nazetore`（channel_id: C0C9CET7LHZ）に1行だけ投稿：`🧪 ストック検証：合格n本・差し戻しm本（累計 合格N/100）`

## C. 完了報告
`data/batch-done.json` に `{"done": "<日付>"}` を書いて push し、`#nazetore` に「🎉 ストック作り完了：合格N本（差し戻し・スキップの一覧は data/queue.json）」と投稿する。ロックを消して終了。

## 失敗時
途中で失敗したら、変更を戻し（`git checkout -- .`）、ロックを消して push して終了する（次の実行が続きをやる）。
