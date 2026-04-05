export function logError(context, error, meta = {}) {
  console.error(JSON.stringify({
    level: 'error',
    context,
    message: error.message || String(error),
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...meta,
  }));
}

export function logInfo(context, message, meta = {}) {
  console.log(JSON.stringify({
    level: 'info',
    context,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }));
}
