(() => {
  'use strict';

  const TAGS = {
    logical:  { name: 'ロジカル思考', ask: 'なぜこうなんだろう？', g: '論', hue: 'violet' },
    customer: { name: '顧客思考', ask: '顧客の視点で考えると？', g: '客', hue: 'coral' },
    channel:  { name: 'チャネル思考', ask: 'どこで、どう売る？', g: '場', hue: 'teal' },
    numbers:  { name: '数字思考', ask: 'その数字の中身は？', g: '数', hue: 'amber' },
    future:   { name: '未来思考', ask: 'この先どうなる？', g: '先', hue: 'violet' },
    strategy: { name: '戦略思考', ask: '何を捨て、どこに賭ける？', g: '戦', hue: 'teal' }
  };
  const WD = ['日', '月', '火', '水', '木', '金', '土'];
  const KEY = 'nazetore.v1';
  const DATA_KEY = 'nazetore.data';
  const REVIEW_GAPS = [3, 7];

  const $app = document.getElementById('app');
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- storage ----------
  function load(k, def) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch { return def; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  const S = Object.assign({ answers: {}, days: {}, points: {}, review: {}, completed: {} }, load(KEY, {}));
  const GOAL = 2;
  const persist = () => save(KEY, S);

  // ---------- dates ----------
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const jpDate = s => { if (!/^\d{4}-/.test(s)) return 'ストック'; const d = new Date(s + 'T00:00:00'); return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`; };
  function weekDays() {
    const d = new Date(); const off = (d.getDay() + 6) % 7; d.setDate(d.getDate() - off);
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return ymd(x); });
  }
  const weekPoints = () => weekDays().reduce((a, k) => a + (S.points[k] || 0), 0);

  // ---------- data ----------
  let DATA = load(DATA_KEY, null);
  let online = navigator.onLine;
  async function fetchData() {
    try {
      const r = await fetch('data/themes.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      const changed = !DATA || DATA.updated !== j.updated || DATA.version !== j.version;
      DATA = j; save(DATA_KEY, j); online = navigator.onLine;
      if (changed && !Q && !/^#\/?review/.test(location.hash)) route();
    } catch { online = false; if (!DATA) route(); }
  }
  const all = () => (DATA && DATA.themes ? DATA.themes.filter(t => !t.review || t.review === 'passed') : []);
  const themes = () => all().filter(t => t.date <= today()).sort((a, b) => b.date.localeCompare(a.date));
  const themeById = id => all().find(t => t.id === id);
  const todays = () => all().filter(t => t.date === today());
  const extras = () => [...themes().filter(t => t.date < today() && !progress(t).done), ...all().filter(t => t.date > today()).sort((a, b) => a.date.localeCompare(b.date))];
  const goalMet = d => (S.completed[d] || 0) >= GOAL;
  const progress = t => { const a = S.answers[t.id] || {}; const n = Object.keys(a).length; const ok = Object.values(a).filter(x => x.correct).length; return { n, ok, total: t.questions.length, done: n >= t.questions.length }; };
  function dueReviews() {
    const td = today();
    return Object.entries(S.review).filter(([, r]) => r.due <= td).map(([k, r]) => { const [id, qi] = k.split('#'); const t = themeById(id); return t && t.questions[+qi] ? { key: k, t, qi: +qi, r } : null; }).filter(Boolean);
  }

  // ---------- ui helpers ----------
  function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2000); }
  const go = h => { location.hash = h; };
  const img = t => t.image ? `<img src="${esc(t.image)}" alt="" loading="lazy" decoding="async">` : '';
  const tagLine = t => t.tags.map(k => TAGS[k] ? TAGS[k].name : k).join('・');
  const prog = (total, idx) => `<div class="prog" aria-hidden="true">${Array.from({ length: total }, (_, i) => `<i class="${i <= idx ? 'on' : ''}"></i>`).join('')}</div>`;
  const mins = t => `${t.questions.length}問・約${Math.max(2, Math.round(t.questions.length * 0.6))}分`;
  function streak() {
    let d = today(), n = 0;
    if (!goalMet(d)) d = addDays(d, -1);
    while (goalMet(d)) { n++; d = addDays(d, -1); }
    return n;
  }
  function status(t) {
    const p = progress(t);
    return p.done ? `<span class="chip done num">${p.ok}/${p.total} 正解</span>` : p.n ? `<span class="chip num">${p.n}/${p.total}</span>` : '';
  }

  // ---------- stats ----------
  const AXES = ['logical', 'customer', 'channel', 'numbers', 'future', 'strategy'];
  function skillStats() {
    const st = Object.fromEntries(AXES.map(k => [k, { n: 0, ok: 0, themes: 0 }]));
    for (const t of all()) {
      const a = S.answers[t.id]; if (!a) continue;
      const n = Object.keys(a).length, ok = Object.values(a).filter(x => x.correct).length;
      for (const k of t.tags) if (st[k]) { st[k].n += n; st[k].ok += ok; if (n >= t.questions.length) st[k].themes++; }
    }
    for (const k of AXES) st[k].xp = st[k].n + st[k].ok;
    return st;
  }
  function radar(st) {
    const W = 320, C = 160, R = 112, n = AXES.length;
    const maxXp = Math.max(...AXES.map(k => st[k].xp));
    const scale = Math.max(20, Math.ceil(maxXp * 1.15 / 10) * 10);
    const pt = (i, r) => { const ang = -Math.PI / 2 + (2 * Math.PI * i) / n; return [C + r * Math.cos(ang), C + r * Math.sin(ang)]; };
    const poly = rs => rs.map((r, i) => pt(i, r).map(v => v.toFixed(1)).join(',')).join(' ');
    const rings = [0.25, 0.5, 0.75, 1].map(f => `<polygon points="${poly(AXES.map(() => R * f))}" class="rg-ring${f === 1 ? ' outer' : ''}"/>`).join('');
    const spokes = AXES.map((_, i) => { const [x, y] = pt(i, R); return `<line x1="${C}" y1="${C}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="rg-spoke"/>`; }).join('');
    const vals = AXES.map(k => Math.max(R * 0.06, R * Math.min(1, st[k].xp / scale)));
    const dots = vals.map((r, i) => { const [x, y] = pt(i, r); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="rg-dot"/>`; }).join('');
    const labels = AXES.map((k, i) => {
      const [x, y] = pt(i, R + 26); const anchor = Math.abs(x - C) < 4 ? 'middle' : x > C ? 'start' : 'end';
      return `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="${anchor}" class="rg-lab">${TAGS[k].name.replace('思考', '')}</text><text x="${x.toFixed(1)}" y="${(y + 19).toFixed(1)}" text-anchor="${anchor}" class="rg-num">${st[k].xp}</text>`;
    }).join('');
    return `<svg viewBox="-40 -10 ${W + 80} ${W + 20}" class="radar" role="img" aria-label="思考スキルのレーダーチャート">${rings}${spokes}<polygon points="${poly(vals)}" class="rg-val"/>${dots}${labels}</svg>`;
  }
  function viewStats() {
    const st = skillStats();
    const answers = Object.values(S.answers).flatMap(a => Object.values(a));
    const n = answers.length, ok = answers.filter(x => x.correct).length;
    const goalDays = Object.keys(S.completed).filter(goalMet).length;
    const ranked = AXES.slice().sort((a, b) => st[b].xp - st[a].xp);
    const weak = ranked[ranked.length - 1];
    const next = all().find(t => t.tags.includes(weak) && !progress(t).done && t.date !== 'stock') || all().find(t => t.tags.includes(weak) && !progress(t).done);
    $app.innerHTML = `
      <div class="qhead"><div class="qnav"><button data-go="#/" aria-label="戻る">‹</button><div class="ctr">分析</div><span></span></div></div>
      <div class="metrics">
        <div><span>解いた問題</span><b class="num">${n}</b></div>
        <div><span>正答率</span><b class="num">${n ? Math.round(ok / n * 100) : 0}%</b></div>
        <div><span>2本達成</span><b class="num">${goalDays}日</b></div>
        <div><span>連続達成</span><b class="num">${streak()}日</b></div>
      </div>
      <div class="panel radar-wrap"><div class="lbl">思考スキル（経験値＝解いた数＋正解数）</div>${n ? radar(st) : '<div class="empty">問題を解くと、ここに形が出てきます</div>'}</div>
      <div class="sec"><h2>スキル別</h2><span>経験値の多い順</span></div>
      <div class="list">${ranked.map(k => { const s = st[k]; const acc = s.n ? Math.round(s.ok / s.n * 100) : 0; return `<div class="row skill"><span class="ic">${TAGS[k].g}</span><span class="t">${TAGS[k].name}<span class="s">${TAGS[k].ask}・テーマ${s.themes}本・${s.n}問</span><span class="meter"><i style="width:${acc}%"></i></span></span><span class="r num">正答 ${acc}%</span></div>`; }).join('')}</div>
      ${n && next ? `<div class="sec"><h2>次に伸ばすなら</h2><span>${TAGS[weak].name}</span></div><div class="list">${row(next, '伸びしろ')}</div>` : ''}`;
  }

  // ---------- views ----------
  function viewHome() {
    const wk = weekDays(), td = today();
    const list = themes().filter(t => t.date < td);
    const tdy = todays();
    const doneN = tdy.filter(t => progress(t).done).length;
    const ex = extras().slice(0, 8);
    const rev = dueReviews();
    $app.innerHTML = `
      <header class="top">
        <div class="brand"><i></i>ナゼトレ</div>
        <div class="hd-r"><div class="ptpill num" aria-label="今週のポイント">今週 ${weekPoints()} pt</div><button class="statbtn" data-go="#/stats" aria-label="分析を見る"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><polygon points="12,3 20,8 20,16 12,21 4,16 4,8" fill="none" stroke="currentColor" stroke-width="1.6"/><polygon points="12,7 16,10 15,15 12,17 8,14 8,10" fill="currentColor" opacity=".55"/></svg></button></div>
      </header>
      <div class="greet">${jpDate(td)}</div>
      <div class="streak">
        <div class="lab">連続達成<b class="num">${streak()}日</b></div>
        <div class="days">${wk.map((d, i) => `<div class="${goalMet(d) ? 'on' : S.days[d] ? 'part' : ''} ${d === td ? 'today' : ''}"><i></i><span>${WD[(i + 1) % 7]}</span></div>`).join('')}</div>
      </div>
      ${!online ? '<div class="offline">オフライン中：保存済みの問題で解けます</div>' : ''}
      <div class="sec"><h2>今日の2本</h2><span class="num ${doneN >= GOAL ? 'goal' : ''}">${doneN >= GOAL ? '達成 ✓' : `${doneN}/${Math.max(GOAL, tdy.length)} 完了`}</span></div>
      ${tdy.length ? `<div class="rail">${tdy.map(card).join('')}</div>` : '<div class="empty">今日の配信はまだ届いていません。下の「おかわり」から解けます。</div>'}
      ${ex.length ? `<div class="sec"><h2>おかわり</h2><span>もっとやりたい日に</span></div><div class="list">${ex.map(t => row(t, t.date > td ? '先取り' : '未完了')).join('')}</div>` : ''}
      ${rev.length ? `<div class="sec"><h2>復習</h2><span>${rev.length}問</span></div><div class="list"><button class="row" data-go="#/review"><span class="ic">復</span><span class="t"><span class="s">3日後・7日後に再出題</span>間違えた問題をもう一度</span><span class="r">›</span></button></div>` : ''}
      <div class="sec"><h2>これまでの配信</h2></div>
      <div class="list">${list.map(t => row(t)).join('') || '<div class="empty">まだ配信がありません</div>'}</div>
      <div class="sec"><h2>記録</h2></div>
      <div class="list"><button class="row" data-act="copyhyp"><span class="ic">仮</span><span class="t"><span class="s">Claudeに貼って添削してもらう用</span>書いた仮説をまとめてコピー</span><span class="r">›</span></button></div>`;
  }
  function row(t, label) {
    const p = progress(t);
    const when = /^\d{4}-/.test(t.date) ? jpDate(t.date) : 'ストック';
    return `<button class="row" data-go="#/t/${t.id}"><span class="mini">${img(t)}</span><span class="t"><span class="s">${esc(t.topic || '')}・${label || when}</span>${esc(t.title)}</span><span class="r num">${p.done ? `${p.ok}/${p.total}` : p.n ? '途中' : label ? '›' : '未回答'}</span></button>`;
  }
  function card(t) {
    return `<button class="card" data-go="#/t/${t.id}">
      <div class="thumb">${img(t)}<span class="chip">${esc(t.topic || 'テーマ')}</span><span class="state">${status(t)}</span></div>
      <div class="body"><h3>${esc(t.title)}</h3><p>${esc(t.learn)}</p>
      <div class="foot"><span>${mins(t)}・${esc(tagLine(t))}</span><span class="go" aria-hidden="true">→</span></div></div></button>`;
  }

  function viewTheme(id) {
    const t = themeById(id); if (!t) return viewHome();
    const p = progress(t);
    $app.innerHTML = `
      <div class="hero">${img(t)}<button class="fab l" data-go="#/" aria-label="戻る">‹</button></div>
      <div class="sheet">
        <span class="chip">${esc(t.topic || 'テーマ')}</span>
        <h1>${esc(t.title)}</h1>
        <div class="meta num">${jpDate(t.date)} 配信・${mins(t)}${p.n && !p.done ? `・${p.n}/${p.total} 回答済み` : ''}${p.done ? `・${p.ok}/${p.total} 正解` : ''}</div>
        <div class="panel"><div class="lbl">なにを学ぶ？</div><div>${esc(t.learn)}</div></div>
        <div class="panel"><div class="lbl">身につく思考の癖</div>
          ${t.tags.map(k => TAGS[k]).filter(Boolean).map(g => `<div class="habit"><span class="hic">${g.g}</span><div><b>${g.name}</b><span>${g.ask}</span></div></div>`).join('')}
        </div>
        <div class="src">出典：${t.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join('／')}</div>
      </div>
      <div class="bar"><button class="btn" data-go="#/q/${t.id}/${p.done ? 0 : Math.min(p.n, t.questions.length - 1)}">${p.done ? 'もう一度解く' : p.n ? '続きから解く' : 'はじめる'}</button></div>`;
  }

  // quiz state for current screen
  let Q = null;
  function viewQuiz(id, qi, mode) {
    const t = themeById(id); if (!t) return viewHome();
    const q = t.questions[qi]; if (!q) return go(`#/r/${id}`);
    const prev = (S.answers[id] || {})[qi];
    Q = { t, qi, q, sel: null, done: false, mode };
    const total = mode === 'review' ? reviewQueue.length : t.questions.length;
    const idx = mode === 'review' ? reviewPos : qi;
    $app.innerHTML = `
      <div class="qhead">
        <div class="qnav">
          <button data-act="prev" aria-label="前の問題" ${idx === 0 ? 'style="visibility:hidden"' : ''}>‹</button>
          <div class="ctr num">${mode === 'review' ? '復習 ' : ''}${idx + 1} / ${total}</div>
          <button data-go="#/" aria-label="閉じる">×</button>
        </div>
        ${prog(total, idx)}
      </div>
      <div class="qcard">
        <div class="strip">${img(t)}<span>${esc(t.topic || '')}｜${esc(t.title)}</span></div>
        <p class="qtext">${esc(q.q)}</p>
      </div>
      ${q.hyp ? `<div class="hyp"><label for="hyp">選ぶ前に、自分の仮説を一言</label><textarea id="hyp" placeholder="例：食品は味が伝わらないので、実演を見せる売り方が効くはず">${prev && prev.hyp ? esc(prev.hyp) : ''}</textarea></div><div class="err" id="herr"></div>` : ''}
      <div class="opts">${q.o.map((o, k) => `<button class="opt" data-opt="${k}"><span class="k">${'ABCDE'[k]}</span><span class="tx">${esc(o)}</span></button>`).join('')}</div>
      <div class="err" id="oerr"></div>
      <div id="after"></div>
      <div class="bar"><button class="btn wait" id="cta" data-act="answer">回答する</button></div>`;
    const h = document.getElementById('hyp'); if (h) h.addEventListener('input', () => { document.getElementById('herr').textContent = ''; });
    window.scrollTo(0, 0);
  }
  function pick(k) {
    if (!Q || Q.done) return;
    Q.sel = k;
    document.querySelectorAll('.opt').forEach(b => b.classList.toggle('sel', +b.dataset.opt === k));
    document.getElementById('cta').classList.remove('wait');
    document.getElementById('oerr').textContent = '';
  }
  function answer() {
    if (!Q) return;
    if (Q.done) return next();
    const { t, qi, q } = Q;
    let hyp = '';
    if (q.hyp) { hyp = document.getElementById('hyp').value.trim(); if (!hyp) { document.getElementById('herr').textContent = '先に仮説を一言書いてください'; document.getElementById('hyp').focus(); return; } }
    if (Q.sel === null) { document.getElementById('oerr').textContent = '選択肢を1つ選んでください'; return; }
    Q.done = true;
    const correct = Q.sel === q.a;
    const td = today();
    const firstToday = !S.days[td];
    S.answers[t.id] = S.answers[t.id] || {};
    const wasDone = progress(t).done;
    const had = S.answers[t.id][qi];
    S.answers[t.id][qi] = { sel: Q.sel, correct: had ? had.correct : correct, hyp: hyp || (had && had.hyp) || '', at: had ? had.at : td };
    S.days[td] = true;
    let reached = false;
    if (!wasDone && progress(t).done) { S.completed[td] = (S.completed[td] || 0) + 1; reached = S.completed[td] === GOAL; }
    if (correct && !had && Q.mode !== 'review') S.points[td] = (S.points[td] || 0) + 1;
    const rk = `${t.id}#${qi}`;
    if (Q.mode === 'review') {
      if (correct) { const r = S.review[rk]; if (r && r.stage + 1 < REVIEW_GAPS.length) S.review[rk] = { stage: r.stage + 1, due: addDays(td, REVIEW_GAPS[r.stage + 1]) }; else delete S.review[rk]; }
      else S.review[rk] = { stage: 0, due: addDays(td, REVIEW_GAPS[0]) };
    } else if (!correct) S.review[rk] = { stage: 0, due: addDays(td, REVIEW_GAPS[0]) };
    persist();
    document.querySelectorAll('.opt').forEach(b => {
      const k = +b.dataset.opt;
      b.classList.remove('sel');
      if (k === q.a) { b.classList.add('ok'); b.insertAdjacentHTML('beforeend', '<span class="mk">正解</span>'); }
      else if (k === Q.sel) { b.classList.add('ng'); b.insertAdjacentHTML('beforeend', '<span class="mk">あなた</span>'); }
      else b.classList.add('dim');
    });
    const last = Q.mode === 'review' ? reviewPos >= reviewQueue.length - 1 : qi >= t.questions.length - 1;
    const cta = document.getElementById('cta');
    cta.dataset.act = 'next'; cta.textContent = last ? '結果を見る' : '次の問題へ'; cta.classList.remove('wait');
    const after = document.getElementById('after');
    after.innerHTML = `
      <div class="exp">
        <div class="hd"><i aria-hidden="true">?</i><b>なぜか、を知ろう</b><span class="verdict ${correct ? 'ok' : 'ng'}">${correct ? '正解' : '不正解'}</span></div>
        <p>${esc(q.e)}</p>
        ${hyp ? `<div class="myhyp"><b>あなたの仮説</b>${esc(hyp)}</div>` : ''}
      </div>`;
    setTimeout(() => after.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    if (reached) toast('今日の2本を達成！');
    else if (firstToday) toast('今日の1問目！');
    else if (!correct) toast('復習リストに追加しました');
  }
  function next() {
    if (!Q) return;
    if (Q.mode === 'review') { reviewPos++; if (reviewPos < reviewQueue.length) { const r = reviewQueue[reviewPos]; return viewQuiz(r.t.id, r.qi, 'review'); } return go('#/'); }
    const n = Q.qi + 1;
    go(n < Q.t.questions.length ? `#/q/${Q.t.id}/${n}` : `#/r/${Q.t.id}`);
  }
  function prevQ() {
    if (!Q) return;
    if (Q.mode === 'review') { if (reviewPos > 0) { reviewPos--; const r = reviewQueue[reviewPos]; viewQuiz(r.t.id, r.qi, 'review'); } return; }
    if (Q.qi > 0) go(`#/q/${Q.t.id}/${Q.qi - 1}`);
  }

  function viewResult(id) {
    const t = themeById(id); if (!t) return viewHome();
    const p = progress(t);
    const hyps = Object.entries(S.answers[id] || {}).filter(([, a]) => a.hyp);
    $app.innerHTML = `
      <div class="qhead"><div class="qnav"><span></span><div class="ctr">結果</div><button data-go="#/" aria-label="閉じる">×</button></div></div>
      <div class="result">${img(t)}<div class="in"><div style="font-size:13px;color:var(--text-3)">${esc(t.topic || '')}</div><div style="font-weight:700;font-size:15px">${esc(t.title)}</div>
      <div class="big num" style="margin-top:12px">${p.ok}<small> / ${p.total}</small></div>
      <p class="num">今週 ${weekPoints()} pt・連続 ${streak()}日</p></div></div>
      ${hyps.length ? `<div class="sec"><h2>あなたの仮説</h2></div><div class="list">${hyps.map(([qi, a]) => `<div class="row"><span class="ic">${+qi + 1}</span><span class="t" style="font-weight:400">${esc(a.hyp)}</span></div>`).join('')}</div>` : ''}
      <div class="pad" style="margin-top:20px">
        ${hyps.length ? `<button class="btn ghost" data-act="copyone" data-id="${t.id}">仮説と問題をコピー（Claudeで添削）</button>` : ''}
        <button class="btn" data-go="#/">ホームへ</button>
      </div>`;
  }

  let reviewQueue = [], reviewPos = 0;
  function startReview() {
    reviewQueue = dueReviews(); reviewPos = 0;
    if (!reviewQueue.length) { toast('今日の復習はありません'); return go('#/'); }
    const r = reviewQueue[0]; viewQuiz(r.t.id, r.qi, 'review');
  }

  function hypText(ids) {
    const out = [];
    for (const t of themes()) {
      if (ids && !ids.includes(t.id)) continue;
      for (const [qi, a] of Object.entries(S.answers[t.id] || {})) {
        if (!a.hyp) continue;
        const q = t.questions[+qi];
        out.push(`【${t.title}】問${+qi + 1}\n問題：${q.q}\n私の仮説：${a.hyp}\n選んだ答え：${q.o[a.sel]}（${a.sel === q.a ? '模範解答と一致' : '模範解答は「' + q.o[q.a] + '」'}）`);
      }
    }
    return out.length ? 'ナゼトレで書いた仮説を添削してください。筋の良さ・抜けている視点・次に確かめるべきデータを指摘してほしい。\n\n' + out.join('\n\n') : '';
  }
  async function copy(text) {
    if (!text) return toast('まだ仮説がありません');
    try { await navigator.clipboard.writeText(text); toast('コピーしました'); }
    catch { const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast('コピーしました'); } catch { toast('コピーできませんでした'); } ta.remove(); }
  }

  // ---------- router ----------
  function route() {
    const h = location.hash.replace(/^#\/?/, '').split('/');
    Q = null;
    if (h[0] === 't') viewTheme(h[1]);
    else if (h[0] === 'q') viewQuiz(h[1], +h[2] || 0);
    else if (h[0] === 'r') viewResult(h[1]);
    else if (h[0] === 'review') startReview();
    else if (h[0] === 'stats') viewStats();
    else viewHome();
    if (h[0] !== 'q') window.scrollTo(0, 0);
  }
  $app.addEventListener('click', e => {
    const el = e.target.closest('[data-go],[data-act],[data-opt]'); if (!el) return;
    if (el.dataset.opt !== undefined) return pick(+el.dataset.opt);
    if (el.dataset.go) return go(el.dataset.go);
    const a = el.dataset.act;
    if (a === 'answer') answer();
    else if (a === 'next') next();
    else if (a === 'prev') prevQ();
    else if (a === 'copyhyp') copy(hypText());
    else if (a === 'copyone') copy(hypText([el.dataset.id]));
  });
  window.addEventListener('hashchange', route);
  window.addEventListener('online', fetchData);
  window.addEventListener('offline', () => { online = false; });

  route();
  fetchData();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
