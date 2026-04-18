const fmt = (level, msg, extra) => {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase()} ${msg}`;
  return extra ? `${base} ${JSON.stringify(extra)}` : base;
};

export const logger = {
  info: (m, e) => console.log(fmt('info', m, e)),
  warn: (m, e) => console.warn(fmt('warn', m, e)),
  error: (m, e) => console.error(fmt('error', m, e)),
  debug: (m, e) => process.env.NODE_ENV !== 'production' && console.log(fmt('debug', m, e)),
};
