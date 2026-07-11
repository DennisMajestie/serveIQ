import Swal from 'sweetalert2';

export function showApiErrorToast(err: any, fallbackMessage: string): void {
  let message = fallbackMessage;

  if (err) {
    if (err.details?.message) {
      message = err.details.message;
    } else if (typeof err.details === 'string') {
      message = err.details;
    } else if (err.details?.error) {
      message = typeof err.details.error === 'string' ? err.details.error : fallbackMessage;
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
