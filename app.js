(() => {
  'use strict';

  const TAGS = {
    logical:  { name: 'ロジカル思考', ask: 'なぜこうなんだろう？', g: '論', hue: 'violet' },
    customer: { name: '顧客思考', ask: '顧客の視点で考えると？', g: '客', hue: 'coral' },
    channel:  { name: 'チャネル思考', ask: 'どこで、どう売る？', g: '場', hue: 'teal' },
    numbers:  { name: '数字思考', ask: 'その数字の中身は？', g: '数', hue: 'amber' },
    future:   { name: '未来思考', ask: 'この先どうなる？', g: '先', hue: 'violet' }
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
  const S = Object.assign({ answers: {}, days: {}, points: {}, review: {} }, load(KEY, {}));
  const persist = () => save(KEY, S);

  // ---------- dates ----------
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const jpDate = s => { const d = new Date(s + 'T00:00:00'); return `${d.getMonth() + 1}月${d.getDate()}日（${WD[d.getDay()]}）`; };
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
      DATA = j; save(DATA_KEY, j); online = true;
      if (changed) route();
    } catch { online = false; if (!DATA) route(); }
  }
  const themes = () => (DATA && DATA.themes ? DATA.themes.slice().sort((a, b) => b.date.localeCompare(a.date)) : []);
  const themeById = id => themes().find(t => t.id === id);
  const progress = t => { const a = S.answers[t.id] || {}; const n = Object.keys(a).length; const ok = Object.values(a).filter(x => x.correct).length; return { n, ok, total: t.questions.length, done: n >= t.questions.length }; };
  function dueReviews() {
    const td = today();
    return Object.entries(S.review).filter(([, r]) => r.due <= td).map(([k, r]) => { const [id, qi] = k.split('#'); const t = themeById(id); return t && t.questions[+qi] ? { key: k, t, qi: +qi, r } : null; }).filter(Boolean);
  }

  // ---------- ui helpers ----------
  function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 2000); }
  const go = h => { location.hash = h; };
  const segs = (total, cur, past) => `<div class="segs" aria-label="${cur + 1} / ${total} 問">${Array.from({ length: total }, (_, i) => `<div class="seg ${i === cur ? 'cur' : i < past ? 'past' : ''}"></div>`).join('')}</div>`;
  const glyph = t => TAGS[t.tags[0]] ? TAGS[t.tags[0]].g : '問';
  const tagLine = t => t.tags.map(k => TAGS[k] ? TAGS[k].name : k).join(' / ');

  // ---------- views ----------
  function viewHome() {
    const wk = weekDays(), td = today();
    const list = themes();
    const fresh = list.filter(t => !progress(t).done);
    const rail = (fresh.length ? fresh : list.slice(0, 3)).slice(0, 6);
    const rev = dueReviews();
    $app.innerHTML = `
      <header class="top">
        <div class="brand">ナゼ<small>トレ</small></div>
        <div class="pt num" aria-label="今週のポイント"><b>${weekPoints()}</b> pt <span style="font-size:12px">今週</span></div>
      </header>
      <div class="week">${wk.map((d, i) => `<div class="day ${S.days[d] ? 'on' : ''} ${d === td ? 'today' : ''}"><div class="dot">${S.days[d] ? '✓' : ''}</div>${WD[(i + 1) % 7]}</div>`).join('')}</div>
      ${!online ? '<div class="offline">オフライン中：保存済みの問題で解けます</div>' : ''}
      <div class="dateline">${jpDate(td)}の配信</div>
      ${rail.length ? `<div class="rail">${rail.map(card).join('')}</div>` : '<div class="empty">問題データを読み込めませんでした。電波のある場所で一度開いてください。</div>'}
      ${rev.length ? `<div class="sec">復習 <span>${rev.length}問</span></div><div class="list"><button class="row" data-go="#/review"><span class="t">間違えた問題をもう一度<span class="s">3日後・7日後に出題されます</span></span><span class="r">はじめる ›</span></button></div>` : ''}
      <div class="sec">これまでの配信</div>
      <div class="list">${list.map(t => { const p = progress(t); return `<button class="row" data-go="#/t/${t.id}"><span class="t">${esc(t.title)}<span class="s">${jpDate(t.date)}・${esc(tagLine(t))}</span></span><span class="r num">${p.done ? `${p.ok}/${p.total}` : p.n ? '途中' : '未回答'}</span></button>`; }).join('') || '<div class="empty">まだ配信がありません</div>'}</div>
      <div class="sec">記録</div>
      <div class="list">
        <button class="row" data-act="copyhyp"><span class="t">書いた仮説をまとめてコピー<span class="s">Claudeに貼って添削してもらう用</span></span><span class="r">›</span></button>
      </div>`;
  }
  function card(t) {
    const p = progress(t);
    return `<button class="card" data-go="#/t/${t.id}">
      <div class="cover h-${t.hue || 'amber'}"><div class="glyph" aria-hidden="true">${glyph(t)}</div><span class="badge h-${t.hue || 'amber'}">テーマ</span></div>
      <div class="body"><h3>${esc(t.title)}</h3><div style="font-size:14px;color:var(--text-2)">${esc(t.learn)}</div>
      <div class="meta"><span>${esc(tagLine(t))}</span>${p.done ? `<span class="done-chip num">${p.ok}/${p.total}</span>` : p.n ? `<span class="num">${p.n}/${p.total}</span>` : ''}</div></div></button>`;
  }

  function viewTheme(id) {
    const t = themeById(id); if (!t) return viewHome();
    const p = progress(t);
    $app.innerHTML = `
      <div class="hero h-${t.hue || 'amber'}"><div class="glyph" aria-hidden="true">${glyph(t)}</div><button class="close" data-go="#/" aria-label="閉じる">×</button><span class="pill">テーマ</span></div>
      <div class="detail">
        <h1>${esc(t.title)}</h1>
        <div style="font-size:14px;color:var(--text-3);display:flex;gap:16px;align-items:center;justify-content:space-between"><span>${jpDate(t.date)} 配信</span>${segs(t.questions.length, -1, p.n)}</div>
        <div class="box"><div class="lbl">なにを学ぶ？</div><div>${esc(t.learn)}</div></div>
        <div class="box" style="margin-top:8px"><div class="lbl">身につく思考の癖</div>
          ${t.tags.map(k => TAGS[k]).filter(Boolean).map(g => `<div class="habit"><div class="ic h-${g.hue}">${g.g}</div><div><b>${g.name}</b><span>${g.ask}</span></div></div>`).join('')}
        </div>
        <div class="src" style="padding:16px 0 0">出典：${t.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>`).join('／')}</div>
      </div>
      <button class="btn" data-go="#/q/${t.id}/${p.done ? 0 : Math.min(p.n, t.questions.length - 1)}">${p.done ? 'もう一度解く' : p.n ? '続きから' : 'ナゼを解く'}</button>`;
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
      <div class="qtop">
        <button class="iconbtn l" data-act="prev" ${idx === 0 ? 'style="visibility:hidden"' : ''}>‹ 前の問題へ</button>
        ${segs(total, idx, idx)}
        <button class="iconbtn r" data-go="#/">閉じる</button>
      </div>
      <div class="qbody"><span class="tagpill">${mode === 'review' ? '復習' : '問題'}</span><p class="qtext">${esc(q.q)}</p></div>
      ${q.hyp ? `<div class="hyp"><label for="hyp">選ぶ前に、自分の仮説を一言</label><textarea id="hyp" placeholder="例：食品は味が伝わらないので、実演を見せる売り方が効くはず">${prev && prev.hyp ? esc(prev.hyp) : ''}</textarea></div><div class="err" id="herr"></div>` : ''}
      <div class="opts">${q.o.map((o, k) => `<button class="opt" data-opt="${k}">${esc(o)}</button>`).join('')}</div>
      <div class="err" id="oerr"></div>
      <button class="btn" id="answer" data-act="answer">回答する</button>
      <div id="after"></div>`;
    const h = document.getElementById('hyp'); if (h) h.addEventListener('input', () => { document.getElementById('herr').textContent = ''; });
    window.scrollTo(0, 0);
  }
  function pick(k) {
    if (!Q || Q.done) return;
    Q.sel = k;
    document.querySelectorAll('.opt').forEach(b => b.classList.toggle('sel', +b.dataset.opt === k));
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
    const had = S.answers[t.id][qi];
    S.answers[t.id][qi] = { sel: Q.sel, correct: had ? had.correct : correct, hyp: hyp || (had && had.hyp) || '', at: td };
    S.days[td] = true;
    if (correct && !(had && had.correct) && Q.mode !== 'review') S.points[td] = (S.points[td] || 0) + 1;
    const rk = `${t.id}#${qi}`;
    if (Q.mode === 'review') {
      if (correct) { const r = S.review[rk]; if (r && r.stage + 1 < REVIEW_GAPS.length) S.review[rk] = { stage: r.stage + 1, due: addDays(td, REVIEW_GAPS[r.stage + 1]) }; else delete S.review[rk]; }
      else S.review[rk] = { stage: 0, due: addDays(td, REVIEW_GAPS[0]) };
    } else if (!correct) S.review[rk] = { stage: 0, due: addDays(td, REVIEW_GAPS[0]) };
    persist();
    document.querySelectorAll('.opt').forEach(b => {
      const k = +b.dataset.opt;
      b.classList.remove('sel');
      if (k === q.a) { b.classList.add('ok'); b.insertAdjacentHTML('beforeend', '<span class="mark"><span>正解</span></span>'); }
      else if (k === Q.sel) { b.classList.add('ng'); b.insertAdjacentHTML('beforeend', '<span class="mark"><span>あなたの回答</span></span>'); }
      else b.classList.add('dim');
    });
    const last = Q.mode === 'review' ? reviewPos >= reviewQueue.length - 1 : qi >= t.questions.length - 1;
    document.getElementById('answer').remove();
    document.getElementById('after').innerHTML = `
      <div class="why"><div class="q" aria-hidden="true">?</div><h2>なぜか、を知ろう</h2></div>
      <div class="exp"><span class="tagpill" style="border-color:var(--accent-ink);color:var(--accent-ink)">解説</span><p>${esc(q.e)}</p>
      ${hyp ? `<div class="myhyp"><b>あなたの仮説</b><br>${esc(hyp)}</div>` : ''}</div>
      <button class="btn" data-act="next">${last ? '結果を見る' : '次へ'}</button>`;
    if (firstToday) toast('今日の1問目！ 連続記録を更新');
    else toast(correct ? '正解' : '復習リストに追加しました');
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
      <div class="qtop"><span></span>${segs(t.questions.length, -1, t.questions.length)}<button class="iconbtn r" data-go="#/">閉じる</button></div>
      <div class="result"><div style="font-size:14px;color:var(--text-2)">${esc(t.title)}</div><div class="big num">${p.ok}<small> / ${p.total}</small></div>
      <p>今週 <b class="num">${weekPoints()}</b> pt</p></div>
      ${hyps.length ? `<div class="sec">あなたの仮説</div><div class="list">${hyps.map(([qi, a]) => `<div class="row"><span class="t">${esc(a.hyp)}<span class="s">問${+qi + 1}</span></span></div>`).join('')}</div>
      <button class="btn ghost" data-act="copyone" data-id="${t.id}">仮説と問題をコピー（Claudeで添削）</button>` : ''}
      <button class="btn" data-go="#/">ホームへ</button>`;
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
