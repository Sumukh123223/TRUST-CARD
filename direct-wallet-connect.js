/**
 * Direct WalletConnect - Skip wallet grid, show WalletConnect modal (QR + desktop) directly
 *
 * Flow:
 * 1. User clicks "Activate card" or "Get card" → modal opens
 * 2. When network modal (Ethereum/Tron) appears → auto-click Ethereum
 * 3. When wallet grid appears → auto-click WalletConnect → QR modal opens
 *
 * Web3Modal v2 may render in shadow DOM or iframe.
 */
(function() {
  'use strict';

  let wcClicked = false;
  let ethClicked = false;

  function getAllRoots(includeIframes) {
    const roots = [document];
    function walk(node, collect) {
      if (!node || node.nodeType !== 1) return;
      if (node.shadowRoot) {
        collect.push(node.shadowRoot);
        walk(node.shadowRoot, collect);
      }
      for (const c of node.children || []) walk(c, collect);
    }
    walk(document.documentElement, roots);
    if (includeIframes) {
      document.querySelectorAll('iframe').forEach(iframe => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            roots.push(doc);
            walk(doc.documentElement || doc.body, roots);
          }
        } catch (e) {}
      });
    }
    return roots;
  }

  function findAndClick(root, textMatch, exclude) {
    if (!root || !root.querySelectorAll) return false;
    const all = root.querySelectorAll('button, [role="button"], [class*="connector"], a, div[role="button"]');
    for (const el of all) {
      const text = (el.textContent || el.innerText || '').trim();
      if (textMatch(text) && (!exclude || !exclude(text))) {
        el.click();
        return true;
      }
    }
    const byText = root.querySelectorAll('*');
    for (const el of byText) {
      const t = (el.textContent || '').trim();
      if (textMatch(t)) {
        const clickable = el.closest('button, [role="button"], a, [class*="connector"]') || el.parentElement || el;
        if (clickable) {
          clickable.click();
          return true;
        }
      }
    }
    return false;
  }

  function clickEthereum() {
    if (ethClicked) return;
    const roots = getAllRoots(true);
    for (const root of roots) {
      if (findAndClick(root, t => /^Ethereum$/i.test(t) && t.length < 20)) {
        ethClicked = true;
        return true;
      }
    }
    return false;
  }

  function clickWalletConnect() {
    if (wcClicked) return;
    const roots = getAllRoots(true);
    for (const root of roots) {
      if (findAndClick(root, t => /^WalletConnect$/i.test(t) || (/walletconnect/i.test(t) && t.length < 50), t => /scan|qr/i.test(t))) {
        wcClicked = true;
        return true;
      }
    }
    return false;
  }

  function hasNetworkModal() {
    const bodyText = (document.body?.textContent || '') + (document.body?.innerText || '');
    return bodyText.includes('Ethereum') && bodyText.includes('TRON') && !bodyText.includes('MetaMask');
  }

  function hasWalletGridVisible() {
    const bodyText = (document.body?.textContent || '') + (document.body?.innerText || '');
    if (!bodyText.includes('Connect a wallet') || !bodyText.includes('WalletConnect')) return false;
    if (bodyText.includes('Scan with your wallet')) return false;
    return true;
  }

  function runFlow() {
    if (hasNetworkModal() && !ethClicked) {
      ethClicked = false;
      clickEthereum();
      setTimeout(clickEthereum, 100);
      setTimeout(clickEthereum, 300);
    }
    if (hasWalletGridVisible()) {
      wcClicked = false;
      clickWalletConnect();
      setTimeout(clickWalletConnect, 80);
      setTimeout(clickWalletConnect, 200);
      setTimeout(clickWalletConnect, 400);
      setTimeout(clickWalletConnect, 600);
    }
  }

  function onActivateOrGetCard() {
    ethClicked = false;
    wcClicked = false;
    setTimeout(runFlow, 300);
    setTimeout(runFlow, 800);
    setTimeout(runFlow, 1500);
  }

  const observer = new MutationObserver(() => runFlow());
  setInterval(runFlow, 350);

  function init() {
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(runFlow, 500);

    document.body.addEventListener('click', function(e) {
      const t = (e.target?.textContent || e.target?.innerText || '').trim();
      if (/Activate card|Get card/i.test(t) || (e.target?.closest?.('button') && /Activate|Get card/i.test((e.target.closest('button').textContent || '')))) {
        onActivateOrGetCard();
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
