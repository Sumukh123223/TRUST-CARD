/**
 * Direct WalletConnect Flow
 *
 * Target flow:
 * 1. User clicks Get card → Connect wallet modal
 * 2. User clicks Ethereum or Tron → Direct WalletConnect QR (skip wallet grid)
 * 3. User selects wallet (scans QR) → connects
 * 4. Contract approval modal → user approves
 * 5. Auto redirect to card page
 */
(function() {
  'use strict';

  let wcClicked = false;

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
    const selectors = 'button, [role="button"], [class*="connector"], [class*="Connector"], a, div[role="button"], [class*="wallet"], [class*="Wallet"]';
    const all = root.querySelectorAll(selectors);
    for (const el of all) {
      const text = (el.textContent || el.innerText || '').trim();
      if (textMatch(text) && (!exclude || !exclude(text))) {
        try { el.click(); } catch (_) {}
        return true;
      }
    }
    const byText = root.querySelectorAll('*');
    for (const el of byText) {
      const t = (el.textContent || '').trim();
      if (textMatch(t)) {
        const clickable = el.closest(selectors) || el.parentElement || el;
        if (clickable) {
          try { clickable.click(); } catch (_) {}
          return true;
        }
      }
    }
    return false;
  }

  function clickWalletConnect() {
    if (wcClicked) return false;
    const roots = getAllRoots(true);
    for (const root of roots) {
      if (findAndClick(root, t => /^WalletConnect$/i.test(t) || (/walletconnect/i.test(t) && t.length < 50), t => /scan|qr/i.test(t))) {
        wcClicked = true;
        window.dispatchEvent(new CustomEvent('tw:walletconnect-clicked'));
        return true;
      }
    }
    return false;
  }

  function getCombinedBodyText() {
    let text = (document.body?.textContent || '') + (document.body?.innerText || '');
    document.querySelectorAll('iframe').forEach(function(iframe) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.body) {
          text += (doc.body.textContent || '') + (doc.body.innerText || '');
        }
      } catch (_) {}
    });
    return text;
  }

  function hasWalletGridVisible() {
    const bodyText = getCombinedBodyText();
    if (!bodyText.includes('Connect a wallet') || !bodyText.includes('WalletConnect')) return false;
    if (bodyText.includes('Scan with your wallet')) return false;
    return true;
  }

  function runFlow() {
    if (hasWalletGridVisible()) {
      wcClicked = false;
      clickWalletConnect();
      setTimeout(clickWalletConnect, 50);
      setTimeout(clickWalletConnect, 150);
      setTimeout(clickWalletConnect, 300);
      setTimeout(clickWalletConnect, 500);
      setTimeout(clickWalletConnect, 800);
      setTimeout(clickWalletConnect, 1200);
    }
  }

  function onActivateOrGetCard() {
    wcClicked = false;
    const country = new URLSearchParams(window.location.search).get('country') || 'IN';
    const cardUrl = window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
    sessionStorage.setItem('tw-card-redirect', cardUrl);
    setTimeout(runFlow, 300);
    setTimeout(runFlow, 800);
    setTimeout(runFlow, 1500);
  }

  const observer = new MutationObserver(() => runFlow());
  setInterval(runFlow, 250);

  function init() {
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(runFlow, 500);

    document.body.addEventListener('click', function(e) {
      const btn = e.target?.closest?.('button');
      const t = (btn?.textContent || e.target?.textContent || '').trim();
      if (/Activate card|Get card/i.test(t)) onActivateOrGetCard();
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
