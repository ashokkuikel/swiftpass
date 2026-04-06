/**
 * SwiftPass - Password Generator
 * @author    Ashok Kuikel
 * @website   https://ashokkuikel.com
 * @version   1.0
 */

'use strict';

const UPPER    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER    = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS  = '0123456789';
const SYMBOLS  = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIG_RE = /[Il1O0o]/g;

// Elements
const pwText         = document.getElementById('pwText');
const regenBtn       = document.getElementById('regenBtn');
const copyPwBtn      = document.getElementById('copyPwBtn');
const lenSlider      = document.getElementById('lenSlider');
const lenVal         = document.getElementById('lenVal');
const optUpper       = document.getElementById('optUpper');
const optLower       = document.getElementById('optLower');
const optNum         = document.getElementById('optNum');
const optSym         = document.getElementById('optSym');
const fillBtn        = document.getElementById('fillBtn');
const strengthFill   = document.getElementById('strengthFill');
const strengthLabel  = document.getElementById('strengthLabel');
const strengthText   = document.getElementById('strengthText');
const strengthIcon   = document.getElementById('strengthIcon');
const statusEl       = document.getElementById('status');
const historySection = document.getElementById('historySection');
const historyList    = document.getElementById('historyList');
const clearHist      = document.getElementById('clearHist');

let currentPassword = '';
let history = [];

// ── Crypto random ─────────────────────────────────────────────────
function randInt(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

// ── Generate ──────────────────────────────────────────────────────
function generate() {
  const len = parseInt(lenSlider.value);

  const U = optUpper.checked ? UPPER : '';
  const L = optLower.checked ? LOWER : '';
  const N = optNum.checked   ? NUMBERS : '';
  const S = optSym.checked   ? SYMBOLS : '';

  let charset = U + L + N + S;
  if (!charset) charset = LOWER;

  // Guarantee at least one from each enabled group
  const pool = [];
  if (U) pool.push(U[randInt(U.length)]);
  if (L) pool.push(L[randInt(L.length)]);
  if (N) pool.push(N[randInt(N.length)]);
  if (S) pool.push(S[randInt(S.length)]);

  while (pool.length < len) pool.push(charset[randInt(charset.length)]);

  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  currentPassword = pool.slice(0, len).join('');
  pwText.textContent = currentPassword;
  updateStrength(currentPassword);
  clearStatus();
}

// ── Strength — strict tiering ─────────────────────────────────────
function calcStrength(pw) {
  const hasUpper  = /[A-Z]/.test(pw);
  const hasLower  = /[a-z]/.test(pw);
  const hasNumber = /[0-9]/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);
  const len = pw.length;
  const typeCount = [hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;

  if (len >= 16 && hasUpper && hasLower && hasNumber && hasSymbol)
    return { label: 'Strong', cls: 'strong', pct: 100, color: '#27ae60', icon: '🛡' };
  if (len >= 12 && typeCount >= 3)
    return { label: 'Good',   cls: 'good',   pct: 70,  color: '#3498db', icon: '🔒' };
  if (len >= 10 && hasUpper && hasLower)
    return { label: 'Fair',   cls: 'fair',   pct: 42,  color: '#e67e22', icon: '⚠️' };
  return       { label: 'Weak',   cls: 'weak',   pct: 16,  color: '#e74c3c', icon: '✗' };
}

function updateStrength(pw) {
  const { label, cls, pct, color, icon } = calcStrength(pw);
  strengthFill.style.width      = pct + '%';
  strengthFill.style.background = color;
  strengthText.textContent      = label;
  strengthIcon.textContent      = icon;
  strengthLabel.className       = 'strength-label ' + cls;
  return cls;
}

// ── Status ────────────────────────────────────────────────────────
function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + type;
}
function clearStatus() {
  statusEl.textContent = '';
  statusEl.className = 'status';
}

// ── Copy password button ──────────────────────────────────────────
copyPwBtn.addEventListener('click', async () => {
  if (!currentPassword) return;
  try {
    await navigator.clipboard.writeText(currentPassword);
    copyPwBtn.textContent = '✓ Copied!';
    copyPwBtn.classList.add('copied');
    addToHistory(currentPassword);
    setTimeout(() => {
      copyPwBtn.textContent = 'Copy password';
      copyPwBtn.classList.remove('copied');
    }, 2000);
  } catch {}
});

// ── Fill on page ──────────────────────────────────────────────────
fillBtn.addEventListener('click', async () => {
  if (!currentPassword) return;
  fillBtn.disabled = true;
  setStatus('Filling password…');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillPasswordOnPage,
      args: [currentPassword],
    });
    const result = results?.[0]?.result;

    if (result?.filled) {
      setStatus(`✓ Filled ${result.count} password field${result.count > 1 ? 's' : ''}`, 'success');
      addToHistory(currentPassword);
    } else {
      setStatus('⚠ No password field — copied to clipboard', 'error');
      await navigator.clipboard.writeText(currentPassword);
      addToHistory(currentPassword);
    }
  } catch {
    setStatus("⚠ Can't fill here — copied to clipboard", 'error');
    try { await navigator.clipboard.writeText(currentPassword); } catch {}
    addToHistory(currentPassword);
  }

  fillBtn.disabled = false;
});

// ── Runs INSIDE the web page ──────────────────────────────────────
function fillPasswordOnPage(password) {
  const fields = Array.from(document.querySelectorAll('input[type="password"]'));

  if (fields.length === 0) {
    const likely = Array.from(document.querySelectorAll('input')).filter(i =>
      /pass|pwd|secret|token/i.test(i.name + i.id + i.placeholder + i.autocomplete)
    );
    if (likely.length === 0) return { filled: false, count: 0 };
    likely.forEach(f => fill(f, password));
    return { filled: true, count: likely.length };
  }

  fields.forEach(f => fill(f, password));
  return { filled: true, count: fields.length };

  function fill(input, value) {
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
    setter ? setter.call(input, value) : (input.value = value);
    input.dispatchEvent(new Event('input',  { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
    input.style.transition = 'box-shadow 0.3s';
    input.style.boxShadow  = '0 0 0 3px #27ae60';
    setTimeout(() => { input.style.boxShadow = ''; }, 1800);
  }
}

// ── History ───────────────────────────────────────────────────────
function addToHistory(pw) {
  if (history.length && history[0].pw === pw) return;
  const { cls } = calcStrength(pw);
  history.unshift({ pw, cls });
  if (history.length > 6) history = history.slice(0, 6);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historySection.style.display = 'none';
    return;
  }
  historySection.style.display = 'block';
  historyList.innerHTML = '';

  history.forEach(({ pw, cls }) => {
    const li = document.createElement('li');
    li.className = 'hist-item';
    li.innerHTML = `
      <span class="hist-pw">${pw}</span>
      <span class="hist-strength ${cls}">${cls}</span>
      <span class="hist-copy" title="Copy">⎘</span>
    `;
    li.addEventListener('click', (e) => {
      if (e.target.classList.contains('hist-copy')) return;
      currentPassword = pw;
      pwText.textContent = pw;
      updateStrength(pw);
      clearStatus();
    });
    li.querySelector('.hist-copy').addEventListener('click', async (e) => {
      e.stopPropagation();
      await navigator.clipboard.writeText(pw);
      e.target.textContent = '✓';
      setTimeout(() => { e.target.textContent = '⎘'; }, 1500);
    });
    historyList.appendChild(li);
  });
}

function saveHistory() {
  chrome.storage.local.set({ swiftpassHistory: history });
}

function loadHistory() {
  chrome.storage.local.get('swiftpassHistory', (data) => {
    history = data.swiftpassHistory || [];
    renderHistory();
  });
}

clearHist.addEventListener('click', () => {
  history = [];
  saveHistory();
  renderHistory();
});

// ── Controls ──────────────────────────────────────────────────────
lenSlider.addEventListener('input', () => {
  lenVal.textContent = lenSlider.value;
  generate();
});
regenBtn.addEventListener('click', generate);
[optUpper, optLower, optNum, optSym].forEach(el => el.addEventListener('change', generate));

// ── Init ──────────────────────────────────────────────────────────
loadHistory();
generate();
