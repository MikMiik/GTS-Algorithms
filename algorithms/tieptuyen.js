/**
 * Phương pháp Tiếp Tuyến (Newton-Raphson 1D) — adapted for UI
 */
function runTiepTuyen(params, logger) {
  const { fStr, dfStr, ddfStr, a: aIn, b: bIn, m1: m1In, epsilon } = params;

  let f, df, ddf;
  try {
    const parsedF = _normalizeMathExpression(fStr);
    const parsedDf = _normalizeMathExpression(dfStr);
    const parsedDdf = _normalizeMathExpression(ddfStr);

    f   = new Function('x', `"use strict"; return (${parsedF});`);
    df  = new Function('x', `"use strict"; return (${parsedDf});`);
    ddf = new Function('x', `"use strict"; return (${parsedDdf});`);
    f(1); df(1); ddf(1);
  } catch (e) {
    logger.error('Lỗi cú pháp hàm: ' + e.message);
    return;
  }

  const a = parseFloat(aIn);
  const b = parseFloat(bIn);
  const m1 = parseFloat(m1In);
  const eps = parseFloat(epsilon);

  if ([a, b, m1, eps].some(isNaN)) { logger.error('Tham số không hợp lệ.'); return; }
  if (eps <= 0) { logger.error('Epsilon phải là số dương.'); return; }
  if (m1 <= 0) { logger.error('m₁ phải là số dương (min|f\'(x)| trên [a,b]).'); return; }

  newtonMethod(f, df, ddf, a, b, m1, eps, 100, logger);
}

function _normalizeMathExpression(expr) {
  if (typeof expr !== 'string') return expr;
  return expr
    // 2x, 2 x, )x  => 2*x, 2*x, )*x
    .replace(/(\d|\))\s*x\b/g, '$1*x')
    // x( ... ), 2( ... ), )( ... ) => x*(...), 2*(...), )*(...)
    .replace(/(\d|x|\))\s*(?=\()/g, '$1*')
    // )2 => )*2
    .replace(/(\))\s*(?=\d)/g, '$1*');
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

function newtonMethod(f, df, ddf, a, b, m1, epsilon, maxIter, logger) {
  logger.section('CHỌN ĐIỂM BẮT ĐẦU (ĐIỂM FOURIER)');
  logger.text('Chọn x₀ sao cho f(x₀)·f\'\'(x₀) > 0');

  let x_curr;
  const fa = f(a), fb = f(b);
  const ddfa = ddf(a), ddfb = ddf(b);

  logger.info(`f(a)=${fa.toFixed(6)}, f''(a)=${ddfa.toFixed(6)}, tích = ${(fa*ddfa).toFixed(6)}`);
  logger.info(`f(b)=${fb.toFixed(6)}, f''(b)=${ddfb.toFixed(6)}, tích = ${(fb*ddfb).toFixed(6)}`);

  if (f(a) * ddf(a) > 0) {
    x_curr = a;
    logger.success(`Chọn x₀ = a = ${a} (f(a)·f''(a) > 0)`);
  } else if (f(b) * ddf(b) > 0) {
    x_curr = b;
    logger.success(`Chọn x₀ = b = ${b} (f(b)·f''(b) > 0)`);
  } else {
    logger.warn('Không tìm thấy điểm Fourier lý tưởng, mặc định x₀ = b.');
    x_curr = b;
  }

  const { tableDecimals, reliableDigits } = _getPrecisionByEpsilon(epsilon);

  let n = 0;
  let fx = f(x_curr);
  let errorEstimate = Math.abs(fx) / m1;
  const tableData = [];

  tableData.push({
    'n': n,
    'xₙ': _formatNumberForTable(x_curr, tableDecimals),
    'f(xₙ)': fx.toExponential(4),
    'sai số |f|/m₁': errorEstimate.toExponential(4),
  });

  logger.section('QUÁ TRÌNH LẶP');
  logger.formula('Công thức: xₙ₊₁ = xₙ - f(xₙ) / f\'(xₙ)');
  logger.text(`Điều kiện dừng: |f(xₙ)| / m₁ ≤ ε = ${epsilon.toExponential(4)}`);

  while (n < maxIter) {
    if (errorEstimate <= epsilon) break;
    n++;
    const deriv = df(x_curr);
    if (Math.abs(deriv) < 1e-15) {
      logger.error('Đạo hàm f\'(xₙ) = 0, không thể tiếp tục.');
      return;
    }
    x_curr = x_curr - fx / deriv;
    fx = f(x_curr);
    errorEstimate = Math.abs(fx) / m1;

    tableData.push({
      'n': n,
      'xₙ': _formatNumberForTable(x_curr, tableDecimals),
      'f(xₙ)': fx.toExponential(4),
      'sai số |f|/m₁': errorEstimate.toExponential(4),
    });
  }

  logger.table(tableData);
  logger.separator();
  logger.text(`m₁ = ${m1}, ngưỡng dừng |f| ≤ m₁·ε = ${(m1*epsilon).toExponential(4)}`);

  if (errorEstimate <= epsilon) {
    logger.success(`✔ Hội tụ sau ${n} bước lặp.`);
    const xReliable = _roundBySignificantDigits(x_curr, reliableDigits);
    logger.result(`Nghiệm gần đúng (${reliableDigits} chữ số đáng tin): x ≈ ${xReliable}`);
    return {
      converged: true,
      iteration: n,
      xRaw: x_curr,
      xRounded: xReliable,
      reliableDigits,
      tableData,
    };
  } else {
    logger.warn(`⚠ Không đạt sai số sau ${maxIter} vòng lặp.`);
    const xReliable = _roundBySignificantDigits(x_curr, reliableDigits);
    return {
      converged: false,
      iteration: maxIter,
      xRaw: x_curr,
      xRounded: xReliable,
      reliableDigits,
      tableData,
    };
  }
}
