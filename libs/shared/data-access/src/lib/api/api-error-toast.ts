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
    } else if (err.message && !err.message.startsWith('An unknown error')) {
      message = err.message;
    }
  }

  Swal.fire({
    icon: 'error',
    title: 'Error',
    text: message,
  });
}
