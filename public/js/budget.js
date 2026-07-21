/**
 * budget.js — Chart.js budget breakdown donut chart
 */

let budgetChart = null;

function renderBudgetChart(budgetBreakdown) {
  const canvas = document.getElementById('budget-chart');
  if (!canvas || !budgetBreakdown) return;

  const categories = [
    { key: 'accommodation', label: 'Accommodation', color: '#6C63FF' },
    { key: 'food',          label: 'Food & Drinks',  color: '#FF6B6B' },
    { key: 'transport',     label: 'Transport',       color: '#FFD166' },
    { key: 'activities',    label: 'Activities',      color: '#06D6A0' },
    { key: 'miscellaneous', label: 'Miscellaneous',   color: '#48CAE4' },
  ];

  const labels  = categories.map(c => c.label);
  const data    = categories.map(c => budgetBreakdown[c.key] || 0);
  const colors  = categories.map(c => c.color);
  const total   = budgetBreakdown.total || data.reduce((a, b) => a + b, 0);

  if (budgetChart) { budgetChart.destroy(); budgetChart = null; }

  budgetChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor: colors,
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const val = ctx.parsed;
              const pct = total > 0 ? Math.round(val / total * 100) : 0;
              return ` ₹${val.toLocaleString('en-IN')} (${pct}%)`;
            },
          },
          backgroundColor: '#13132A',
          borderColor: 'rgba(255,255,255,0.07)',
          borderWidth: 1,
          padding: 12,
          titleColor: '#E8E8F5',
          bodyColor: '#8A8AA8',
        },
      },
    },
  });

  // Render breakdown list
  const listEl = document.getElementById('budget-breakdown-list');
  if (listEl) {
    listEl.innerHTML = categories.map(c => {
      const amount = budgetBreakdown[c.key] || 0;
      const pct = total > 0 ? Math.round(amount / total * 100) : 0;
      return `
        <div class="budget-item">
          <div class="budget-item-left">
            <div class="budget-dot" style="background:${c.color};"></div>
            <span>${c.label}</span>
          </div>
          <div>
            <div class="budget-amount">${formatINR(amount)}</div>
            <div style="font-size:0.72rem;color:var(--text-dim);text-align:right;">${pct}%</div>
          </div>
        </div>
      `;
    }).join('') + `
      <div class="divider"></div>
      <div class="budget-item" style="border:1px solid rgba(108,99,255,0.2);background:rgba(108,99,255,0.05);border-radius:var(--radius-md);">
        <div class="budget-item-left"><span style="font-weight:700;">Total Estimated</span></div>
        <div class="budget-amount" style="color:var(--primary-light);font-size:1.05rem;">${formatINR(total)}</div>
      </div>
      ${budgetBreakdown.notes ? `<div class="budget-note">${budgetBreakdown.notes}</div>` : ''}
    `;
  }

  // Update center total
  const totalEl = document.querySelector('.budget-total-amount');
  if (totalEl) totalEl.textContent = formatINR(total);
}

window.renderBudgetChart = renderBudgetChart;
