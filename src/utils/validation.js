function isValidAmount(amount, min = 1) {
  const num = Number(amount);
  return !isNaN(num) && num > 0 && num >= min && Number.isFinite(num);
}

function sanitize(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>"'&]/g, '').trim();
}

function isValidMethod(method) {
  const valid = ['upi', 'paytm', 'google pay', 'bank transfer'];
  return valid.includes(method.toLowerCase());
}

function isValidAccount(account) {
  return typeof account === 'string' && account.length >= 3 && account.length <= 100;
}

module.exports = { isValidAmount, sanitize, isValidMethod, isValidAccount };
