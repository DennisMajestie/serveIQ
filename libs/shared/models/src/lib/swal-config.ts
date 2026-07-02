import Swal, { type SweetAlertOptions } from 'sweetalert2';

const appDefaults: SweetAlertOptions = {
  background: '#1e293b',
  color: '#fff',
  confirmButtonColor: '#f97316',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  iconColor: '#f97316',
  timerProgressBar: true,
};

const origFire = Swal.fire.bind(Swal) as (...args: any[]) => any;

Swal.fire = ((...args: unknown[]) => {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
    return origFire({ ...appDefaults, ...args[0] });
  }
  return origFire(args[0], args[1], args[2]);
}) as typeof Swal.fire;

export function bootstrapSwal(): void {
  /* patch applied at import time */
}
