/**
 * Phương pháp Chia Đôi (Bisection) — adapted for UI
 * Thay console.log/table bằng logger object
 */
function runBisection(params, logger) {
  const { fStr, a: aIn, b: bIn, epsilon } = params;

  let f;
  try {
    f = new Function('x', `"use strict"; return (${fStr});`);
    f(0); // test
  } catch (e) {
    logger.error('Lỗi cú pháp hàm f(x): ' + e.message);
    return;
  }

  const a_num = parseFloat(aIn);
  const b_num = parseFloat(bIn);
  const eps = parseFloat(epsilon);

  if (isNaN(a_num) || isNaN(b_num) || isNaN(eps)) {
    logger.error('Các tham số a, b, epsilon phải là số hợp lệ.');
    return;
  }
  if (eps <= 0) {
    logger.error('Epsilon phải là số dương.');
    return;
  }

  bisectionMethod(f, a_num, b_num, eps, 200, logger);
}

function bisectionMethod(f, a, b, epsilon, maxIter, logger) {
  let fa = f(a);
  let fb = f(b);

  logger.section('KIỂM TRA ĐIỀU KIỆN ĐẦU VÀO');
  logger.info(`f(a) = f(${a}) = ${fa.toFixed(8)}`);
  logger.info(`f(b) = f(${b}) = ${fb.toFixed(8)}`);
  logger.info(`f(a) × f(b) = ${(fa * fb).toExponential(4)}`);

  if (fa * fb >= 0) {
    logger.error('f(a) và f(b) phải trái dấu. Khoảng [a, b] không hợp lệ.');
    return;
  }
  logger.success('✔ f(a)·f(b) < 0 — khoảng hợp lệ.');

  const tableDecimals = Math.ceil(-Math.log10(epsilon)) + 1;
  const reliableDecimals = Math.round(-Math.log10(2 * epsilon));

  let n = 0;
  let c = 0;
  let z = 0;
  let diff = Math.abs(b - a);
  const tableData = [];

  logger.section('QUÁ TRÌNH LẶP');
  logger.formula(`Công thức: c = (a + b) / 2`);
  logger.text(`Điều kiện dừng: |b - a| < ε = ${epsilon.toExponential(4)}`);

  while (n < maxIter) {
    n++;
    c = (a + b) / 2.0;
    z = f(c);
    diff = Math.abs(b - a);

    tableData.push({
      'n': n,
      'a': a.toFixed(tableDecimals),
      'b': b.toFixed(tableDecimals),
      'c (nghiệm)': c.toFixed(tableDecimals),
      'f(c)': z.toFixed(tableDecimals),
      '|b-a|': diff.toFixed(tableDecimals),
    });

    if (z === 0 || diff < epsilon) break;

    if (fa * z < 0) { b = c; fb = z; }
    else { a = c; fa = z; }
  }

  logger.table(tableData);
  logger.separator();
  logger.text(`Ngưỡng sai số yêu cầu (ε): ${epsilon.toExponential(4)}`);

  if (diff < epsilon || z === 0) {
    logger.success(`✔ Thỏa mãn điều kiện dừng tại bước lặp n = ${n}.`);
    logger.result(`Nghiệm gần đúng (${reliableDecimals} chữ số đáng tin): x ≈ ${c.toFixed(reliableDecimals)}`);
  } else {
    logger.warn(`⚠ Thuật toán không hội tụ sau ${maxIter} vòng lặp.`);
  }
}
