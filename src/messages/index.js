const en = require('./en');

const messages = {
  en,
};

function getMsg(key, lang = 'en', ...args) {
  const dict = messages[lang] || messages.en;
  const template = dict[key];
  if (typeof template === 'function') {
    return template(...args);
  }
  return template || messages.en[key] || key;
}

module.exports = { getMsg, messages };
