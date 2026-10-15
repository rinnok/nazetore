"""themes.json と画像の整合チェック。自動生成の公開前に必ず通す。

使い方: python scripts/validate.py [YYYY-MM-DD]
  日付を渡すと、その日の配信が2本以上あるかも確認する。
終了コード 0 = OK / 1 = NG（理由を表示）
"""
import json
import os
import re
import sys
import xml.dom.minidom

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TAGS = {'logical', 'customer', 'channel', 'numbers', 'future', 'strategy'}
errors = []
warnings = []

d = json.load(open(os.path.join(ROOT, 'data', 'themes.json'), encoding='utf-8'))
seen = set()
titles = set()
for t in d['themes']:
    tid = t.get('id', '?')
    if tid in seen:
        errors.append(f'{tid}: id が重複')
    seen.add(tid)
    for k in ('date', 'title', 'topic', 'learn', 'tags', 'image', 'sources', 'questions'):
        if not t.get(k):
            errors.append(f'{tid}: {k} がない')
    if t.get('date') and not (re.fullmatch(r'\d{4}-\d{2}-\d{2}', t['date']) or t['date'] == 'stock'):
        errors.append(f'{tid}: date は YYYY-MM-DD か "stock"')
    if set(t.get('tags', [])) - TAGS:
        errors.append(f'{tid}: 未知のタグ {set(t["tags"]) - TAGS}')
    img = os.path.join(ROOT, t.get('image', ''))
    if not os.path.isfile(img):
        errors.append(f'{tid}: 画像がない {t.get("image")}')
    else:
        try:
            xml.dom.minidom.parse(img)
        except Exception as e:
            errors.append(f'{tid}: SVGが壊れている {e}')
    for s in t.get('sources', []):
        if not str(s.get('url', '')).startswith('http'):
            errors.append(f'{tid}: 出典URLが不正')
    if t.get('review') not in (None, 'pending', 'passed', 'rejected'):
        errors.append(f'{tid}: review は pending / passed / rejected')
    if t.get('title') in titles:
        errors.append(f'{tid}: タイトルが他のテーマと重複')
    titles.add(t.get('title'))
    qs = t.get('questions', [])
    if len(qs) == 5 and len({q.get('a') for q in qs}) == 1:
        errors.append(f'{tid}: 正解の位置が5問とも同じ（偏らせない）')
    if len(qs) != 5:
        errors.append(f'{tid}: 問題は5問（いま{len(qs)}問）')
    if qs and not qs[-1].get('hyp'):
        errors.append(f'{tid}: 5問目は "hyp": true にする')
    longest = 0
    for i, q in enumerate(qs, 1):
        if any('推論' in o for o in q.get('o', [])):
            errors.append(f'{tid}: 問{i} の選択肢に「推論」と書かない（答えがバレる。解説に書く）')
        os_ = q.get('o', [])
        if len(os_) == 3 and q.get('a') in (0, 1, 2) and len(os_[q['a']]) > 1.4 * max(len(o) for j, o in enumerate(os_) if j != q['a']):
            longest += 1
        if len(q.get('o', [])) != 3 or q.get('a') not in (0, 1, 2) or not q.get('q') or not q.get('e'):
            errors.append(f'{tid}: 問{i} の形式が不正（3択・a=0〜2・q/e必須）')
    if longest >= 3:
        msg = f'{tid}: 正解だけが極端に長い問題が{longest}問（選択肢の長さと具体性をそろえる）'
        (errors if t.get('review') == 'pending' else warnings).append(msg)

if len(sys.argv) > 1:
    day = sys.argv[1]
    n = sum(1 for t in d['themes'] if t.get('date') == day)
    if n < 2:
        errors.append(f'{day} の配信が{n}本（2本以上必要）')

if warnings:
    print('WARN（要改善・公開は可）')
    print('\n'.join(warnings))
if errors:
    print('NG')
    print('\n'.join(errors))
    sys.exit(1)
print(f'OK: {len(d["themes"])} themes')
