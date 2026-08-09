import Swal from 'sweetalert2';

export function showApiErrorToast(err: any, fallbackMessage: string): void {
  let message = fallbackMessage;

  if (err) {
    const body = err.error || err;

    if (body.serverMessage) {
      message = body.serverMessage;
    } else if (body.meta?.message) {
      const metaMsg = body.meta.message;
      message = Array.isArray(metaMsg) ? metaMsg[0] : metaMsg;
    } else if (body.message) {
      message = body.message;
    } else if (body.detail) {
      message = body.detail;
    } else if (body.error?.message) {
      message = body.error.message;
    } else if (body.error && typeof body.error === 'string') {
      message = body.error;
    } else if (typeof body === 'string') {
      message = body;
    } else if (body.details?.message) {
      message = body.details.message;
    } else if (body.details?.error?.message) {
      message = body.details.error.message;
    } else if (body.details?.error && typeof body.details.error === 'string') {
      message = body.details.error;
    } else if (typeof body.details === 'string') {
      message = body.details;
    } else if (body.details?.detail) {
      message = body.details.detail;
    } else if (body.details?.meta?.message) {
      const msg = body.details.meta.message;
      message = Array.isArray(msg) ? msg[0] : msg;
    } else if (body.details?.errors && Array.isArray(body.details.errors)) {
      const first = body.details.errors[0];
      message = typeof first === 'string' ? first : first.message || first.detail || first.msg || message;
    } else if (body.details && typeof body.details === 'object') {
      const vals = Object.values(body.details);
      const strVal = vals.find(v => typeof v === 'string');
      if (strVal) message = strVal;
    }
  }

  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
  });
}
