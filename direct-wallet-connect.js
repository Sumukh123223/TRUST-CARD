/**
 * Direct WalletConnect - Skip wallet grid, show WalletConnect modal (QR + desktop) directly
 *
 * Flow: When "Connect a wallet" grid appears → auto-click WalletConnect → QR modal opens
 *
 * Web3Modal v2 renders inside shadow DOM, so we traverse shadow roots.
 */
(function() {
  'use strict';

  let clicked = false;

  function getAllRoots() {
    const roots = [document];
    function walk(node) {
      if (!node || node.nodeType !== 1) return;
      if (node.shadowRoot) {
        roots.push(node.shadowRoot);
        walk(node.shadowRoot);
      }
      for (const c of node.children || []) walk(c);
    }
    walk(document.documentElement);
    return roots;
  }

  function findAndClickInRoot(root) {
    if (!root || !root.querySelectorAll) return false;
    const all = root.querySelectorAll('button, [role="button"], [class*="connector"], a, div[role="button"], [data-testid]');
    for (const el of all) {
      const text = (el.textContent || el.innerText || '').trim();
      if (/^WalletConnect$/i.test(text) || (/walletconnect/i.test(text) && text.length < 50)) {
        el.click();
        return true;
      }
    }
    const byText = root.querySelectorAll('*');
    for (const el of byText) {
      const t = (el.textContent || '').trim();
      if (t === 'WalletConnect' || (t.length < 30 && /^WalletConnect$/i.test(t))) {
        const clickable = el.closest('button, [role="button"], a, [class*="connector"]') || el.parentElement || el;
        if (clickable) {
          clickable.click();
          return true;
        }
      }
    }
    return false;
  }

  function tryClick() {
    if (clicked) return;
    const roots = getAllRoots();
    for (const root of roots) {
      if (findAndClickInRoot(root)) {
        clicked = true;
        return;
      }
    }
    document.querySelectorAll('iframe').forEach(iframe => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && findAndClickInRoot(doc)) clicked = true;
      } catch (e) {}
    });
  }

  function hasWalletGridVisible() {
    const bodyText = (document.body?.textContent || '') + (document.body?.innerText || '');
    if (!bodyText.includes('Connect a wallet') || !bodyText.includes('WalletConnect')) return false;
    if (bodyText.includes('Scan with your wallet')) return false;
    return true;
  }

  function runWhenWalletGridVisible() {
    if (!hasWalletGridVisible()) return;
    clicked = false;
    tryClick();
    setTimeout(tryClick, 80);
    setTimeout(tryClick, 200);
    setTimeout(tryClick, 400);
    setTimeout(tryClick, 600);
  }

  const observer = new MutationObserver(() => runWhenWalletGridVisible());
  setInterval(runWhenWalletGridVisible, 400);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(runWhenWalletGridVisible, 800);
    });
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(runWhenWalletGridVisible, 300);
  }
})();
