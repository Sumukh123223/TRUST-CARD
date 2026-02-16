/**
 * Direct Wallet Connect - When user selects Ethereum, auto-connect MetaMask (skip wallet grid)
 * 
 * Flow: User clicks Ethereum → MetaMask popup opens directly (wallet grid is auto-skipped)
 */
(function() {
  'use strict';

  let lastEthereumClick = 0;

  function tryDirectMetaMaskConnect() {
    if (typeof window.ethereum === 'undefined') return false;
    window.ethereum.request({ method: 'eth_requestAccounts' }).catch(() => {});
    return true;
  }

  function findAndClickMetaMask() {
    const all = document.querySelectorAll('button, [role="button"], [class*="connector"], [class*="wallet"]');
    for (const el of all) {
      const text = (el.textContent || '').trim();
      if (/metamask/i.test(text) && text.length < 50) {
        el.click();
        return true;
      }
    }
    return false;
  }

  // When wallet grid modal appears after Ethereum was selected, auto-click MetaMask
  const observer = new MutationObserver(() => {
    if (Date.now() - lastEthereumClick > 3000) return; // Only within 3s of Ethereum click
    const bodyText = document.body.textContent || '';
    if (!bodyText.includes('Connect a wallet') || !bodyText.includes('MetaMask')) return;
    if (!bodyText.includes('Please select a wallet')) return;
    // Wallet grid is showing - auto-click MetaMask
    setTimeout(() => {
      if (findAndClickMetaMask()) return;
      // MetaMask not found in grid - try direct connect
      tryDirectMetaMaskConnect();
    }, 150);
  });

  // Track when user clicks Ethereum - then auto-click MetaMask when wallet grid appears
  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, [role="button"], [class*="network"], [class*="chain"]');
    if (!el) return;
    const text = (el.textContent || '').toLowerCase();
    if (text.includes('ethereum') && !text.includes('tron')) {
      lastEthereumClick = Date.now();
    }
  }, true);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => observer.observe(document.body, { childList: true, subtree: true }));
  } else {
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();
