import type { SweetAlertOptions } from 'sweetalert2';

const appDefaults: SweetAlertOptions = {
  background: '#1e293b',
  color: '#fff',
  confirmButtonColor: '#f97316',
  cancelButtonColor: '#6b7280',
  reverseButtons: true,
  iconColor: '#f97316',
  timerProgressBar: true,
  width: '32rem',
  customClass: {
    container: 'swal-container',
    popup: 'swal-popup',
    title: 'swal-title',
    htmlContainer: 'swal-content',
    actions: 'swal-actions',
    confirmButton: 'swal-confirm-btn',
    denyButton: 'swal-deny-btn',
    cancelButton: 'swal-cancel-btn',
  },
};

let pending: Promise<void> | null = null;

/**
 * Applies the app-wide SweetAlert2 defaults to the shared `Swal` singleton.
 *
 * `sweetalert2` is imported dynamically (the `import type` above is erased at
 * compile time) so that this module can live in the app's statically-imported
 * barrel without dragging ~93 kB of dialog library into the initial bundle.
 * Components still `import Swal from 'sweetalert2'` and call `Swal.fire(...)`
 * directly; because ESM modules are singletons, the patch below mutates that
 * same shared object.
 *
 * The patch must land before the first `Swal.fire` call. Nothing in app
 * bootstrap or the root providers opens a dialog, and route components are
 * lazily loaded, so awaiting this at startup is sufficient.
 */
export function bootstrapSwal(): Promise<void> {
  pending ??= (async () => {
    const { default: Swal } = await import('sweetalert2');
    const origFire = Swal.fire.bind(Swal) as (...args: any[]) => any;

    Swal.fire = ((...args: unknown[]) => {
      if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
        return origFire({ ...appDefaults, ...args[0] });
      }
      return origFire(args[0], args[1], args[2]);
    }) as typeof Swal.fire;
  })();

  return pending;
}