/**
 * Phương pháp Dây Cung (Secant/Chord) — adapted for UI
 */
function runDayCung(params, logger) {
  const { fStr, a: aIn, b: bIn, epsilon } = params;

  let f;
  try {
    f = new Function('x', `"use strict"; return (${fStr});`);
    f(0);
  } catch (e) {
    logger.error('Lỗi cú pháp hàm f(x): ' + e.message);
    return;
  }

  const a = parseFloat(aIn);
  const b = parseFloat(bIn);
  const eps = parseFloat(epsilon);

  if ([a, b, eps].some(isNaN)) { logger.error('Tham số không hợp lệ.'); return; }
  if (eps <= 0) { logger.error('Epsilon phải là số dương.'); return; }

  solveDayCungUI(f, a, b, eps, 100, logger);
}

function _numDeriv1(f, x, h = 1e-7) {
  return (f(x + h) - f(x - h)) / (2 * h);
}

function _numDeriv2(f, x, h = 1e-5) {
  return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
}

function _estimateM1m1(f, a, b, numPts = 500) {
  let m1 = Infinity, M1 = 0;
  const h = (b - a) / numPts;
  for (let i = 0; i <= numPts; i++) {
    const fpAbs = Math.abs(_numDeriv1(f, a + i * h));
    if (fpAbs < m1) m1 = fpAbs;
    if (fpAbs > M1) M1 = fpAbs;
  }
  return { m1, M1 };
}

function _getPrecisionByEpsilon(epsilon) {
  const tableDecimals = Math.max(0, Math.ceil(-Math.log10(epsilon)) + 2);
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

function solveDayCungUI(f, a, b, epsilon, maxIter, logger) {
  logger.section('KIỂM TRA ĐIỀU KIỆN');
  const fa = f(a), fb = f(b);
  logger.info(`f(a) = f(${a}) = ${fa.toFixed(6)}`);
  logger.info(`f(b) = f(${b}) = ${fb.toFixed(6)}`);

  if (fa * fb >= 0) {
    logger.error(`f(a)·f(b) = ${(fa*fb).toFixed(6)} ≥ 0 — không phải khoảng cách ly nghiệm!`);
    return;
  }
  logger.success('✔ f(a)·f(b) < 0 — khoảng hợp lệ.');
  const { tableDecimals, reliableDigits } = _getPrecisionByEpsilon(epsilon);

  const { m1, M1 } = _estimateM1m1(f, a, b);
  const q = (M1 - m1) / m1;
  logger.section('ƯỚC LƯỢNG m₁, M₁');
  logger.info(`m₁ = min|f'(x)| ≈ ${m1.toFixed(6)}`);
  logger.info(`M₁ = max|f'(x)| ≈ ${M1.toFixed(6)}`);
  logger.info(`Hệ số dây cung q = (M₁ - m₁)/m₁ = ${q.toFixed(6)}`);

  if (m1 < 1e-14) {
    logger.error('m₁ ≈ 0, f\' có thể bằng 0 trong khoảng. Phương pháp không áp dụng được.');
    return;
  }

  // Chọn điểm Fourier
  const fda = _numDeriv2(f, a);
  const fdb = _numDeriv2(f, b);
  logger.section('XÁC ĐỊNH ĐIỂM FOURIER');
  logger.text(`Điều kiện: f(d)·f''(d) > 0`);
  logger.info(`f''(a) = ${fda.toFixed(6)}, f(a)·f''(a) = ${(fa*fda).toFixed(6)}`);
  logger.info(`f''(b) = ${fdb.toFixed(6)}, f(b)·f''(b) = ${(fb*fdb).toFixed(6)}`);

  let d, x0;
  if (fa * fda > 0) {
    d = a; x0 = b;
    logger.success(`Chọn d = a = ${a} [ĐIỂM MỐC CỐ ĐỊNH], x₀ = b = ${b} [ĐIỂM BIẾN THIÊN]`);
  } else if (fb * fdb > 0) {
    d = b; x0 = a;
    logger.success(`Chọn d = b = ${b} [ĐIỂM MỐC CỐ ĐỊNH], x₀ = a = ${a} [ĐIỂM BIẾN THIÊN]`);
  } else {
    logger.error('Không tìm được điểm Fourier. Kiểm tra lại khoảng [a,b].');
    return;
  }

  const fd = f(d);
  logger.section('QUÁ TRÌNH LẶP');
  logger.formula(`Công thức: xₖ₊₁ = xₖ - f(xₖ)·(xₖ - d) / (f(xₖ) - f(d))`);
  logger.text(`d = ${d} (cố định), f(d) = ${fd.toFixed(8)}`);
  logger.text(`Điều kiện dừng CT(1): |f(xₖ)| / m₁ < ε = ${epsilon}`);

  let xk = x0, xPrev = null;
  const tableData = [];

  for (let k = 0; k < maxIter; k++) {
    const fxk = f(xk);
    const denom = fxk - fd;

    if (Math.abs(denom) < 1e-15) {
      logger.warn('Dừng: mẫu số ≈ 0 (f(xₖ) ≈ f(d)).');
      break;
    }

    const xNext = xk - (fxk * (xk - d)) / denom;
    const fxNext = f(xNext);
    const errTarget = Math.abs(fxk) / m1;
    const errConsec = xPrev !== null ? ((M1 - m1) / m1) * Math.abs(xk - xPrev) : null;

    tableData.push({
      'k': k,
      'xₖ': _formatNumberForTable(xk, tableDecimals),
      'f(xₖ)': fxk.toExponential(4),
      'xₖ₊₁': _formatNumberForTable(xNext, tableDecimals),
      'f(xₖ₊₁)': fxNext.toExponential(4),
      'CT(1) |f|/m₁': errTarget.toExponential(4),
    });

    if (errTarget < epsilon) {
      logger.table(tableData);
      logger.separator();
      logger.success(`✔ Hội tụ tại bước k = ${k}`);
      logger.text(`  Tiêu chí CT(1): |f(xₖ)|/m₁ = ${errTarget.toExponential(4)} < ε = ${epsilon}`);
      const xReliable = _roundBySignificantDigits(xNext, reliableDigits);
      logger.result(`Nghiệm gần đúng (${reliableDigits} chữ số đáng tin): x* ≈ ${xReliable}`);
      logger.info(`Kiểm tra: f(x*) = ${fxNext.toExponential(6)}`);
      return {
        converged: true,
        criterion: 'CT1',
        iteration: k,
        xRaw: xNext,
        xRounded: xReliable,
        reliableDigits,
        tableData,
      };
    }

    if (errConsec !== null && errConsec < epsilon) {
      logger.table(tableData);
      logger.separator();
      logger.success(`✔ Hội tụ tại bước k = ${k} (CT2)`);
      const xReliable = _roundBySignificantDigits(xNext, reliableDigits);
      logger.result(`Nghiệm gần đúng (${reliableDigits} chữ số đáng tin): x* ≈ ${xReliable}`);
      logger.info(`Kiểm tra: f(x*) = ${fxNext.toExponential(6)}`);
      return {
        converged: true,
        criterion: 'CT2',
        iteration: k,
        xRaw: xNext,
        xRounded: xReliable,
        reliableDigits,
        tableData,
      };
    }

    xPrev = xk;
    xk = xNext;
  }

  logger.table(tableData);
  const xReliable = _roundBySignificantDigits(xk, reliableDigits);
  logger.warn(`Không hội tụ sau ${maxIter} bước. Kết quả cuối: x ≈ ${_formatNumberForTable(xk, tableDecimals)}`);
  return {
    converged: false,
    iteration: maxIter,
    xRaw: xk,
    xRounded: xReliable,
    reliableDigits,
    tableData,
  };
}
