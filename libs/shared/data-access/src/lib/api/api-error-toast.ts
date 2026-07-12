import Swal from 'sweetalert2';

export function showApiErrorToast(err: any, fallbackMessage: string): void {
  let message = fallbackMessage;

  if (err) {
    if (err.serverMessage) {
      message = err.serverMessage;
    } else if (err.details?.message) {
      message = err.details.message;
    } else if (err.details?.error?.message) {
      message = err.details.error.message;
    } else if (err.details?.error && typeof err.details.error === 'string') {
      message = err.details.error;
    } else if (typeof err.details === 'string') {
      message = err.details;
    } else if (err.details?.detail) {
      message = err.details.detail;
    } else if (err.details?.meta?.message) {
      const msg = err.details.meta.message;
      message = Array.isArray(msg) ? msg[0] : msg;
    } else if (err.details?.errors && Array.isArray(err.details.errors)) {
      const first = err.details.errors[0];
      message = typeof first === 'string' ? first : first.message || first.detail || first.msg || message;
    } else if (err.details && typeof err.details === 'object') {
      const vals = Object.values(err.details);
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
