/**
 * Lặp Đơn Hệ Phi Tuyến (Fixed-Point System) — adapted for UI
 * Hệ phi cố định: 
 *   φ₁ = (cos(x₂x₃) + 0.5) / 3
 *   φ₂ = (1/25)√(x₁² + 0.3125) - 0.03
 *   φ₃ = -(1/20)e^(-x₁x₂) - (10π-3)/60
 */
function runLapDonSystem(params, logger) {
  const { x0Str, q: qIn, epsilon } = params;

  let x0Arr;
  try {
    x0Arr = x0Str.trim().split(/[\s,;]+/).map(v => {
      const n = parseFloat(v);
      if (isNaN(n)) throw new Error(`Giá trị "${v}" không hợp lệ`);
      return n;
    });
  } catch (e) {
    logger.error('Lỗi đọc X₀: ' + e.message);
    return;
  }

  if (x0Arr.length < 3) { logger.error('Cần đúng 3 giá trị cho X₀ = [x₁, x₂, x₃].'); return; }

  const q = parseFloat(qIn);
  const eps = parseFloat(epsilon);

  if (isNaN(q) || isNaN(eps)) { logger.error('q và epsilon phải là số hợp lệ.'); return; }
  if (q >= 1) { logger.error('Hệ số co q phải nhỏ hơn 1.'); return; }
  if (eps <= 0) { logger.error('Epsilon phải là số dương.'); return; }

  fixedPointSystemUI(x0Arr, q, eps, 100, logger);
}

// Hệ hàm lặp cố định (từ file gốc lap-don-giai-he-phi-tuyen.js)
const _phiFuncsSystem = [
  (X) => (Math.cos(X[1] * X[2]) + 0.5) / 3,
  (X) => (1 / 25) * Math.sqrt(X[0] * X[0] + 0.3125) - 0.03,
  (X) => -(1 / 20) * Math.exp(-X[0] * X[1]) - (10 * Math.PI - 3) / 60,
];

function fixedPointSystemUI(X0, q, epsilon, maxIter, logger) {
  const epsilon0 = ((1 - q) / q) * epsilon;
  const tableDecimals = Math.ceil(-Math.log10(epsilon)) + 1;
  const reliableDecimals = Math.round(-Math.log10(2 * epsilon));
  const n = X0.length;

  logger.section('THÔNG TIN HỆ PHƯƠNG TRÌNH (CỐ ĐỊNH)');
  logger.formula('φ₁(X) = (cos(x₂·x₃) + 0.5) / 3');
  logger.formula('φ₂(X) = (1/25)·√(x₁² + 0.3125) - 0.03');
  logger.formula('φ₃(X) = -(1/20)·e^(-x₁·x₂) - (10π-3)/60');
  logger.section('THÔNG TIN KHỞI ĐẦU');
  logger.info(`X₀ = [${X0.join(', ')}]`);
  logger.info(`q = ${q} (hệ số co)`);
  logger.info(`ε = ${epsilon.toExponential(4)}`);
  logger.info(`ε₀ = ((1-q)/q)·ε = ${epsilon0.toExponential(4)} (ngưỡng dừng)`);
  logger.formula('Công thức: Xₖ₊₁ = Φ(Xₖ)');
  logger.text('Điều kiện dừng: ||Xₖ - Xₖ₋₁||∞ < ε₀');

  let X_prev = [...X0];
  let X_curr = [...X0];
  let step = 0, maxDiff = 0;
  const tableData = [];

  const fmtVec = (v) => `[${v.map(vi => vi.toFixed(tableDecimals)).join(', ')}]`;

  tableData.push({
    'k': 0,
    'X_k': fmtVec(X0),
    '||ΔX||∞': '—',
  });

  logger.section('QUÁ TRÌNH LẶP');

  while (step < maxIter) {
    step++;
    maxDiff = 0;

    for (let i = 0; i < n; i++) {
      X_curr[i] = _phiFuncsSystem[i](X_prev);
      const d = Math.abs(X_curr[i] - X_prev[i]);
      if (d > maxDiff) maxDiff = d;
    }

    tableData.push({
      'k': step,
      'X_k': fmtVec(X_curr),
      '||ΔX||∞': maxDiff.toFixed(tableDecimals),
    });

    if (maxDiff < epsilon0) break;
    X_prev = [...X_curr];
  }

  logger.table(tableData);
  logger.separator();
  logger.text(`Ngưỡng dừng ε₀ = ${epsilon0.toExponential(4)}`);

  if (maxDiff < epsilon0) {
    logger.success(`✔ Thỏa mãn điều kiện dừng tại bước k = ${step}.`);
    logger.result(`Nghiệm gần đúng (${reliableDecimals} chữ số đáng tin): X ≈ [${X_curr.map(v => v.toFixed(reliableDecimals)).join(', ')}]`);
  } else {
    logger.warn(`⚠ Thuật toán không hội tụ sau ${maxIter} vòng lặp.`);
    logger.text(`Kết quả cuối: X = [${X_curr.map(v => v.toFixed(tableDecimals)).join(', ')}]`);
  }
}
