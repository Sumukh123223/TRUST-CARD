/**
 * Direct WalletConnect - When user selects Ethereum, show WalletConnect modal (QR + desktop wallets)
 * 
 * Flow: User clicks Ethereum → WalletConnect modal opens (QR code, Binance, SafePal, etc.)
 */
(function() {
  'use strict';

  let lastEthereumClick = 0;

  function findAndClickWalletConnect() {
    const all = document.querySelectorAll('button, [role="button"], [class*="connector"], [class*="wallet"], a');
    for (const el of all) {
      const text = (el.textContent || '').trim();
      if (/walletconnect/i.test(text) && text.length < 80) {
        el.click();
        return true;
      }
    }
    return false;
  }

  // When wallet grid modal appears after Ethereum was selected, auto-click WalletConnect
  const observer = new MutationObserver(() => {
    if (Date.now() - lastEthereumClick > 3000) return; // Only within 3s of Ethereum click
    const bodyText = document.body.textContent || '';
    if (!bodyText.includes('Connect a wallet') || !bodyText.includes('WalletConnect')) return;
    if (!bodyText.includes('Please select a wallet')) return;
    // Wallet grid is showing - auto-click WalletConnect to show QR + desktop options
    setTimeout(() => {
      findAndClickWalletConnect();
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
