// ⚠️ FROZEN MEDICAL KERNEL — 输入范围校验，禁止修改（统一入口 src/kernel/index.js）
// src/lib/validation.js
// 输入范围校验（从原 App.jsx 原样搬运）
export function validateInput(variable, value) {
  if (value === '' || value === undefined) return null;
  const num = parseFloat(value);
  if (isNaN(num)) return '请输入数字';
  if (variable.min !== undefined && num < variable.min) return `不能小于 ${variable.min}`;
  if (variable.max !== undefined && num > variable.max) return `不能大于 ${variable.max}`;
  return null;
}
