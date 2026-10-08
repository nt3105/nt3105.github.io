/* Code corner, journal, sharing, appearance and local game scores. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const read = (key, fallback) => { try { const value = localStorage.getItem(key); return value === null ? fallback : JSON.parse(value); } catch { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  async function copy(text, status, fallback) {
    try {
      if (!navigator.clipboard) throw new Error('Unavailable');
      await navigator.clipboard.writeText(text);
      status.textContent = 'Đã sao chép.';
    } catch {
      status.textContent = 'Chọn nội dung bên dưới rồi sao chép thủ công.';
      if (fallback) { fallback.hidden = false; fallback.value = text; fallback.focus(); fallback.select(); }
    }
  }

  const samples = {
    c: { label: 'C', file: 'hello.c', info: 'Chương trình C cơ bản. Lưu thành hello.c và biên dịch bằng trình biên dịch C.', output: 'Xin chao, minh la Ngan Tu!', code: '#include <stdio.h>\n\nint main(void) {\n    printf("Xin chao, minh la Ngan Tu!\\n");\n    return 0;\n}\n' },
    objc: { label: 'Objective-C', file: 'main.m', info: 'Ví dụ dùng Foundation. Chạy trong dự án Command Line Tool của Xcode trên macOS.', output: 'Xin chào, mình là Ngân Tú!', code: '#import <Foundation/Foundation.h>\n\nint main(int argc, const char *argv[]) {\n    @autoreleasepool {\n        NSString *name = @"Ngân Tú";\n        NSLog(@"Xin chào, mình là %@!", name);\n    }\n    return 0;\n}\n' },
    swift: { label: 'Swift', file: 'Hello.swift', info: 'Ví dụ Swift cơ bản. Chạy bằng Swift hoặc trong Xcode Playground.', output: 'Xin chào, mình là Ngân Tú!\nĐang khám phá: C\nĐang khám phá: Objective-C\nĐang khám phá: Swift', code: 'let name = "Ngân Tú"\nlet languages = ["C", "Objective-C", "Swift"]\n\nprint("Xin chào, mình là \\(name)!")\n\nfor language in languages {\n    print("Đang khám phá: \\(language)")\n}\n' }
  };
  const tabs = [...document.querySelectorAll('[data-code-language]')];
  let selected = 'c';
  function selectCode(key, focus = false) {
    if (!samples[key]) return;
    selected = key;
    const sample = samples[key];
    $('#code-content').textContent = sample.code;
    $('#code-file').textContent = sample.file;
    $('#code-note').textContent = sample.info;
    $('#code-status').textContent = '';
    const output = $('#code-output');
    if (output) { output.hidden = true; output.textContent = ''; }
    $('#code-copy-fallback').hidden = true;
    $('#code-panel').setAttribute('aria-labelledby', 'code-tab-' + key);
    tabs.forEach(tab => { const on = tab.dataset.codeLanguage === key; tab.setAttribute('aria-selected', String(on)); tab.tabIndex = on ? 0 : -1; if (on && focus) tab.focus(); });
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCode(tab.dataset.codeLanguage));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectCode(tabs[next].dataset.codeLanguage, true); }
    });
  });
  $('#copy-code').addEventListener('click', () => copy(samples[selected].code, $('#code-status'), $('#code-copy-fallback')));
  const runButton = $('#run-code');
  if (runButton) {
    runButton.addEventListener('click', () => {
      const output = $('#code-output');
      const sample = samples[selected];
      output.hidden = false;
      output.textContent = '$ ' + sample.file + '\nđang chạy…';
      window.setTimeout(() => {
        output.textContent = '$ ' + sample.file + '\n' + sample.output + '\n\nĐã chạy xong.';
        $('#code-status').textContent = 'Đã chạy xong.';
      }, 320);
    });
  }
  selectCode('c');

  const shareDialog = $('#share-dialog');
  const shareUrl = document.querySelector('link[rel="canonical"]').href;
  let shareOpener;
  $('#share-url').value = shareUrl;
  function openShare() { shareOpener = document.activeElement; $('#share-status').textContent = ''; shareDialog.showModal(); }
  document.querySelectorAll('[data-share-web]').forEach(button => button.addEventListener('click', openShare));
  $('#share-close').addEventListener('click', () => shareDialog.close());
  shareDialog.addEventListener('close', () => shareOpener?.focus({preventScroll:true}));
  $('#copy-share').addEventListener('click', () => copy(shareUrl, $('#share-status'), $('#share-url')));
  const nativeButton = $('#native-share');
  nativeButton.hidden = typeof navigator.share !== 'function';
  nativeButton.addEventListener('click', async () => {
    try { await navigator.share({ title: 'Ngân Tú — Code & Game', text: 'Ghé thăm không gian của Ngân Tú.', url: shareUrl }); $('#share-status').textContent = 'Đã mở chia sẻ.'; }
    catch (error) { if (error.name !== 'AbortError') $('#share-status').textContent = 'Chưa chia sẻ được. Bạn có thể sao chép liên kết hoặc quét QR.'; }
  });

  const SCORE_KEY = 'ngan-tu-snake-scores-v1';
  const levels = { easy: 'Dễ', normal: 'Vừa', hard: 'Khó' };
  const stored = read(SCORE_KEY, []);
  let scores = (Array.isArray(stored) ? stored : []).filter(row => row && Number.isSafeInteger(row.score) && row.score >= 0 && levels[row.difficulty] && typeof row.assisted === 'boolean' && typeof row.date === 'string' && !Number.isNaN(Date.parse(row.date)));
  const scoreTable = $('#leaderboard-body');
  function renderScores() {
    scoreTable.replaceChildren();
    const filter = $('#leaderboard-level').value;
    const assisted = $('#leaderboard-mode').value === 'assisted';
    const rows = scores.filter(row => row.difficulty === filter && row.assisted === assisted).sort((a,b) => b.score - a.score || b.date.localeCompare(a.date)).slice(0,5);
    rows.forEach((row,index) => {
      const tr = document.createElement('tr');
      [String(index+1), String(row.score), new Date(row.date).toLocaleDateString('vi-VN')].forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.append(td); });
      scoreTable.append(tr);
    });
    $('#leaderboard-empty').hidden = rows.length > 0;
  }
  $('#leaderboard-level').addEventListener('change', renderScores);
  $('#leaderboard-mode').addEventListener('change', renderScores);
  document.addEventListener('nt-snake-result', event => {
    const row = event.detail;
    if (!row || !Number.isSafeInteger(row.score) || row.score < 0 || !levels[row.difficulty]) return;
    scores.push({ score: row.score, difficulty: row.difficulty, assisted: !!row.assisted, date: new Date().toISOString() });
    // Retain up to five results for each difficulty and each mode.
    scores = Object.keys(levels).flatMap(level => [false,true].flatMap(assisted => scores.filter(item => item.difficulty === level && item.assisted === assisted).sort((a,b) => b.score-a.score || b.date.localeCompare(a.date)).slice(0,5)));
    const saved = save(SCORE_KEY, scores);
    $('#score-storage-note').textContent = saved ? 'Điểm lưu trên trình duyệt này. Chỉ ghi nhận ván đã kết thúc.' : 'Trình duyệt đang chặn lưu dữ liệu. Điểm chỉ giữ trong lần mở trang này.';
    $('#leaderboard-level').value = row.difficulty;
    $('#leaderboard-mode').value = row.assisted ? 'assisted' : 'normal';
    renderScores();
  });
  renderScores();
})();
