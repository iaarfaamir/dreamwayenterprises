const totalAmountEl = document.getElementById('totalAmount');
const advanceRateEl = document.getElementById('advanceRate');
const advanceAmountDisplay = document.getElementById('advanceAmountDisplay');
const markupRateEl = document.getElementById('markupRate');
const loanYearsEl = document.getElementById('loanYears');
const frequencyEl = document.getElementById('frequency');
const firstPaymentDateEl = document.getElementById('firstPaymentDate');

const kpiRemaining = document.getElementById('kpiRemaining');
const kpiInstallment = document.getElementById('kpiInstallment');
const kpiMarkup = document.getElementById('kpiMarkup');
const kpiTotalPayment = document.getElementById('kpiTotalPayment');
const kpiNumPayments = document.getElementById('kpiNumPayments');
const scheduleSummaryText = document.getElementById('scheduleSummaryText');
const scheduleBody = document.getElementById('scheduleBody');

let breakdownChart = null;
let trajectoryChart = null;

function formatCurrency(val) {
    const num = Math.abs(val) < 0.0001 ? 0 : val;
    return 'Rs ' + num.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function calculateLoan() {
    const total = parseFloat(totalAmountEl.value) || 0;
    const advPercent = (parseFloat(advanceRateEl.value) || 0) / 100;
    const advance = total * advPercent;
    const principal = total - advance;
    const annualRate = (parseFloat(markupRateEl.value) || 0) / 100;
    const years = parseInt(loanYearsEl.value) || 1;
    const ppy = parseInt(frequencyEl.value) || 12;

    advanceAmountDisplay.value = advance.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    const numPayments = years * ppy;
    const ratePerPeriod = annualRate / ppy;

    let pmt = 0;
    if (ratePerPeriod > 0) {
        pmt = principal * (ratePerPeriod * Math.pow(1 + ratePerPeriod, numPayments)) / (Math.pow(1 + ratePerPeriod, numPayments) - 1);
    } else {
        pmt = principal / numPayments;
    }

    const totalPayments = pmt * numPayments;
    const totalMarkup = totalPayments - principal;

    kpiRemaining.textContent = formatCurrency(principal);
    kpiInstallment.textContent = formatCurrency(pmt);
    kpiMarkup.textContent = formatCurrency(totalMarkup);
    kpiTotalPayment.textContent = formatCurrency(totalPayments);
    kpiNumPayments.textContent = `${numPayments} Payments`;

    const freqNames = {12: 'Monthly', 6: 'Bi-Monthly', 4: 'Quarterly', 2: 'Semi-Annual', 1: 'Annual'};
    scheduleSummaryText.textContent = `${years}-year schedule • ${freqNames[ppy] || 'Custom'} installments`;

    const rawDateStr = firstPaymentDateEl.value;
    const baseDate = rawDateStr ? new Date(rawDateStr + 'T00:00:00') : new Date();

    let currentBalance = principal;
    let htmlRows = '';
    let labels = [];
    let balanceHistory = [principal];

    for (let i = 1; i <= numPayments; i++) {
        const markupPortion = currentBalance * ratePerPeriod;
        const principalPortion = pmt - markupPortion;
        currentBalance = Math.max(0, currentBalance - principalPortion);

        let dueDate = new Date(baseDate.getTime());
        const monthOffset = (i - 1) * (12 / ppy);
        dueDate.setMonth(baseDate.getMonth() + monthOffset);

        const dateStr = dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

        htmlRows += `
            <tr class="hover:bg-slate-700/40">
                <td class="py-2.5 px-4 font-mono text-xs text-slate-400">${i}</td>
                <td class="py-2.5 px-4 font-medium text-blue-300">${dateStr}</td>
                <td class="py-2.5 px-4 text-right font-medium text-white">${formatCurrency(pmt)}</td>
                <td class="py-2.5 px-4 text-right text-amber-400">${formatCurrency(markupPortion)}</td>
                <td class="py-2.5 px-4 text-right text-emerald-400">${formatCurrency(principalPortion)}</td>
                <td class="py-2.5 px-4 text-right font-mono text-slate-300">${formatCurrency(currentBalance)}</td>
            </tr>
        `;

        labels.push(`P${i}`);
        balanceHistory.push(currentBalance);
    }

    scheduleBody.innerHTML = htmlRows;
    updateCharts(principal, totalMarkup, labels, balanceHistory);
}

function updateCharts(principal, totalMarkup, labels, balanceHistory) {
    if (breakdownChart) breakdownChart.destroy();
    const ctx1 = document.getElementById('breakdownChart').getContext('2d');
    breakdownChart = new Chart(ctx1, {
        type: 'doughnut',
        data: {
            labels: ['Principal', 'Markup/Profit'],
            datasets: [{
                data: [principal, totalMarkup],
                backgroundColor: ['#3b82f6', '#f59e0b'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { labels: { color: '#cbd5e1', font: { size: 11 } } } }
        }
    });

    if (trajectoryChart) trajectoryChart.destroy();
    const ctx2 = document.getElementById('trajectoryChart').getContext('2d');
    trajectoryChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: ['Start', ...labels],
            datasets: [{
                label: 'Balance',
                data: balanceHistory,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: { ticks: { color: '#94a3b8', font: { size: 9 } } },
                y: { ticks: { color: '#94a3b8', font: { size: 9 } } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function init() {
    const defaultDate = new Date();
    firstPaymentDateEl.value = defaultDate.toISOString().split('T')[0];

    [totalAmountEl, advanceRateEl, markupRateEl, loanYearsEl, frequencyEl, firstPaymentDateEl].forEach(input => {
        input.addEventListener('input', calculateLoan);
    });

    calculateLoan();
}

document.addEventListener('DOMContentLoaded', init);
