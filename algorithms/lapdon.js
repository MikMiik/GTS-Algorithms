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

function fixedPointIteration1D(phi, x0, q, epsilon, maxIter, logger) {
  const epsilon0 = ((1 - q) / q) * epsilon;
  const tableDecimals = Math.ceil(-Math.log10(epsilon)) + 1;
  const reliableDecimals = Math.round(-Math.log10(2 * epsilon));

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

  tableData.push({ 'n': 0, 'xₙ': x0.toFixed(tableDecimals), '|xₙ - xₙ₋₁|': '—' });

  logger.section('QUÁ TRÌNH LẶP');

  while (n < maxIter) {
    n++;
    x_curr = phi(x_prev);
    diff = Math.abs(x_curr - x_prev);

    tableData.push({
      'n': n,
      'xₙ': x_curr.toFixed(tableDecimals),
      '|xₙ - xₙ₋₁|': diff.toFixed(tableDecimals),
    });

    if (diff < epsilon0) break;
    x_prev = x_curr;
  }

  logger.table(tableData);
  logger.separator();
  logger.text(`Ngưỡng dừng ε₀ = ${epsilon0.toExponential(4)}`);

  if (diff < epsilon0) {
    logger.success(`✔ Thỏa mãn điều kiện dừng tại bước n = ${n}.`);
    logger.result(`Nghiệm gần đúng (${reliableDecimals} chữ số đáng tin): x ≈ ${x_curr.toFixed(reliableDecimals)}`);
  } else {
    logger.warn(`⚠ Thuật toán không hội tụ sau ${maxIter} vòng lặp.`);
  }
}
