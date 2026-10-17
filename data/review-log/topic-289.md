# topic-289 検証ログ（独立査読）

| 主張｜確認できた根拠（自分の言葉で1行）｜出典URL｜判定 |
|---|
| 2022年2月2日のQ4決算でMetaが影響を約100億ドルと見込んだ｜CFOのWehner氏が決算説明で「100億ドル規模」の逆風と述べた｜https://www.cnbc.com/2022/02/02/facebook-says-apple-ios-privacy-change-will-cost-10-billion-this-year.html｜OK |
| 当時の財務責任者／「最善の見積もり」｜CFOが「現時点のベストな見積もり」と断った旨の報道を複数媒体で確認｜https://www.cnbc.com/2022/02/02/facebook-says-apple-ios-privacy-change-will-cost-10-billion-this-year.html｜OK |
| 約100億ドルは年間売上の約8％｜Forbesが「年間売上の8％近く」と書いている（検索要約で確認、本文は直接取得できず）｜https://www.forbes.com/sites/danielnewman/2022/02/10/apple-meta-and-the-ten-billion-dollar-impact-of-privacy-changes/｜OK（「Forbesによると」と帰属を明示済み） |
| ATT：他社アプリ／サイトをまたぐ追跡に利用者の許可が必要、IDFAへのアクセスが制限される｜ATTは広告主のiPhone識別子へのアクセスを制限し、ターゲティングを弱める仕組みと説明されている｜https://finance.yahoo.com/news/how-apple-app-tracking-transparency-works-162225922-220141435.html｜OK |
| 許可しない人が増えると広告効果を測りにくくなる（因果）｜上記解説およびCNBCで、ターゲティングと効果測定が弱まる点が説明されている｜https://www.cnbc.com/2022/02/02/facebook-says-apple-ios-privacy-change-will-cost-10-billion-this-year.html｜OK |
| 発表後の「1週間で」Meta・Snap・Twitter・Pinterestが大きく下がった｜報道は決算翌日（2/3）の下落（Meta約22-26%、Snap約18%、Twitter約8%、Pinterest約11%）。1週間ではない。しかもSnapは2/4に決算で約58%急騰し反転した｜https://techstartups.com/2022/02/03/apple-privacy-changes-wiped-off-278-billion-market-value-4-companies-new-ios-features-prevent-tracking-selling-users-personal-data/ ／ https://www.cnbc.com/2022/02/04/snap-shares-rise-more-than-after-strong-q4-earnings-report.html｜修正（「翌日」に限定） |
| Meta株の下落率｜22%（Business Insider系）と26%（Forbes/CNBC終値）で報道が割れる｜https://www.cnbc.com/2022/02/03/facebook-shares-plummet-22percent-after-reporting-weak-guidance.html｜本文では数値を使わず現状どおり（OK） |
| q5（複数測定を組み合わせる）｜推論として hyp:true 表示済み。事実主張ではない｜—｜OK |

## 判断
- 正解が1つか：全問1つのみ正解。q4は「どこも上がった」が誤り（Snapは後日急騰するが当日は下落）で一意。
- 文言の転用：記事の直訳的な文はなく問題なし。
- 正解の目立ち：q5は正解だけ長く具体的で目立つ。q4も正解がやや目立つ。書き換え案を下に記載。

## 修正案
q4 q: 「この決算発表の翌日、広告に頼るほかのSNS各社（Snap・Twitter・Pinterestなど）の株価は、どうなった？」
q4 e: 「発表の翌日、Snap・Twitter・Pinterestなどの株価も大きく下がったと報じられています。ただしSnapは、その翌日に自社の決算を受けて大きく反発しました。」
q5 o（同じ長さ・具体性）:
 0: 「測定がなくなるので、広告費は大きく減らすべき」
 1: 「測り方とねらい方が変わるので、複数の指標を組み合わせて見直す」
 2: 「影響は主に一時的なので、今の運用を変えず様子を見る」
