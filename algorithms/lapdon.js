/**
 * Lặp Đơn 1 biến (Fixed-Point Iteration 1D) — adapted for UI
 */
function runLapDon(params, logger) {
  const { phiStr, x0: x0In, q: qIn, epsilon } = params;

  let phi;
  try {
    phi = new Function('x', `"use strict"; return (${phiStr});`);
    phi(0);
  } catch (e) {
    logger.error('Lỗi cú pháp hàm φ(x): ' + e.message);
    return;
  }

  const x0 = parseFloat(x0In);
  const q  = parseFloat(qIn);
  const eps = parseFloat(epsilon);

  if ([x0, q, eps].some(isNaN)) { logger.error('Tham số không hợp lệ.'); return; }
  if (q >= 1) { logger.error('Hệ số co q phải nhỏ hơn 1 (q < 1).'); return; }
  if (eps <= 0) { logger.error('Epsilon phải là số dương.'); return; }

  fixedPointIteration1D(phi, x0, q, eps, 100, logger);
}

function _getPrecisionByEpsilon(epsilon) {
  const tableDecimals = Math.max(0, Math.ceil(-Math.log10(epsilon)) + 1);
  const reliableDigits = Math.max(1, Math.round(-Math.log10(2 * epsilon)));
  return { tableDecimals, reliableDigits };
}

function _roundBySignificantDigits(value, significantDigits) {
  if (!Number.isFinite(value)) return value;
  if (Math.abs(value) < 1e-15) return 0;
  const exponent = Math.floor(Math.log10(Math.abs(value)));
  const decimalPlaces = significantDigits - exponent - 1;
  const factor = Math.pow(10, decimalPlaces);
  return Math.round(value * factor) / factor;
}

function _formatNumberForTable(value, decimals) {
  if (!Number.isFinite(value)) return String(value);
  if (Math.abs(value) < 1e-15) return '0';
  return value.toFixed(decimals);
}

function fixedPointIteration1D(phi, x0, q, epsilon, maxIter, logger) {
  const epsilon0 = ((1 - q) / q) * epsilon;
  const { tableDecimals, reliableDigits } = _getPrecisionByEpsilon(epsilon);

  logger.section('THÔNG TIN KHỞI ĐẦU');
  logger.info(`x₀ = ${x0}`);
  logger.info(`q = ${q} (hệ số co)`);
  logger.info(`ε = ${epsilon.toExponential(4)}`);
  logger.info(`ε₀ = ((1-q)/q)·ε = ${epsilon0.toExponential(4)} (ngưỡng dừng)`);
  logger.formula(`Công thức: xₙ₊₁ = φ(xₙ)`);
  logger.text(`Điều kiện dừng: |xₙ - xₙ₋₁| < ε₀`);

  let x_prev = x0, x_curr = x0;
  let n = 0, diff = 0;
  const tableData = [];

  tableData.push({ 'n': 0, 'xₙ': _formatNumberForTable(x0, tableDecimals), '|xₙ - xₙ₋₁|': '—' });

  logger.section('QUÁ TRÌNH LẶP');

  while (n < maxIter) {
    n++;
    x_curr = phi(x_prev);
    diff = Math.abs(x_curr - x_prev);

    tableData.push({
      'n': n,
      'xₙ': _formatNumberForTable(x_curr, tableDecimals),
      '|xₙ - xₙ₋₁|': _formatNumberForTable(diff, tableDecimals),
    });

    if (diff < epsilon0) break;
    x_prev = x_curr;
  }

  logger.table(tableData);
  logger.separator();
  logger.text(`Ngưỡng dừng ε₀ = ${epsilon0.toExponential(4)}`);

  if (diff < epsilon0) {
    logger.success(`✔ Thỏa mãn điều kiện dừng tại bước n = ${n}.`);
    const xReliable = _roundBySignificantDigits(x_curr, reliableDigits);
    logger.result(`Nghiệm gần đúng (${reliableDigits} chữ số đáng tin): x ≈ ${xReliable}`);
  } else {
    logger.warn(`⚠ Thuật toán không hội tụ sau ${maxIter} vòng lặp.`);
  }
}
