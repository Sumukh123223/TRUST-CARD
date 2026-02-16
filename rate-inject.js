/**
 * Injects USDT/INR rate into the page when React fails to load it.
 * Finds the rate section by structure and populates it from /api/usdt-price.
 */
(function () {
  const FEE = '0.5%';
  function fmt(v) { return v != null ? '₹' + Number(v).toFixed(2) : '—'; }
  function fmtChange(v) {
    if (v == null) return '—';
    return (v >= 0 ? '+' : '') + '₹' + Math.abs(v).toFixed(2);
  }
  function fmtPct(v) {
    if (v == null) return '';
    return (v >= 0 ? '↑' : '↓') + (v >= 0 ? '' : '-') + Math.abs(v).toFixed(2) + '%';
  }

  function findRateCard() {
    const all = document.querySelectorAll('p');
    for (const p of all) {
      if (p.textContent.trim() === 'USDT / INR') {
        return p.closest('div[class*="rounded"]');
      }
    }
    return null;
  }

  async function inject() {
    try {
      const res = await fetch(window.location.origin + '/api/usdt-price');
      if (!res.ok) return;
      const d = await res.json();
      const card = findRateCard();
      if (!card) return;
      const placeholders = card.querySelectorAll('[class*="animate-pulse"]');
      placeholders.forEach((el, i) => {
        const parent = el.parentElement;
        if (!parent) return;
        if (el.offsetWidth > 100) {
          el.outerHTML = '<p class="font-display text-3xl font-bold text-foreground">' + fmt(d.currentPrice) + '</p>' +
            (d.changePercent != null ? '<span class="ml-2 text-sm ' + (d.changePercent >= 0 ? 'text-green-500' : 'text-red-500') + '">' + fmtPct(d.changePercent) + '</span>' : '');
        } else if (el.offsetWidth < 80) {
          el.outerHTML = '<p class="font-display text-lg font-semibold ' + (d.change >= 0 ? 'text-green-500' : 'text-red-500') + '">' + fmtChange(d.change) + '</p>';
        }
      });
      const trendLabel = Array.from(card.querySelectorAll('p')).find(p => p.textContent.includes('7-day trend'));
      if (trendLabel && d.prices?.length) {
        const container = trendLabel.parentElement;
        if (container && !container.querySelector('svg')) {
          const div = document.createElement('div');
          div.className = 'mt-2 h-32 w-full';
          div.style.maxWidth = '320px';
          div.innerHTML = buildChart(d.prices);
          container.appendChild(div);
        }
      }
    } catch (_) {}
  }

  function buildChart(prices) {
    const vals = prices.map(p => p.price);
    const min = Math.min(...vals), max = Math.max(...vals), r = max - min || 1;
    const w = 280, h = 100, pad = 40;
    const pts = prices.map((p, i) => {
      const x = pad + (i / (prices.length - 1 || 1)) * (w - pad - 10);
      const y = 10 + (h - 20) - ((p.price - min) / r) * (h - 20);
      return (i === 0 ? 'M' : 'L') + ' ' + x + ' ' + y;
    }).join(' ');
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" class="w-full h-full"><path d="' + pts + '" fill="none" stroke="hsl(187,85%,53%)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(inject, 1500));
  } else {
    setTimeout(inject, 1500);
  }
})();
