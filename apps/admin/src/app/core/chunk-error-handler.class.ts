import { ErrorHandler, Injectable } from '@angular/core';

@Injectable()
export class ChunkErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    const errorMsg = error?.message || error?.toString() || '';
    
    const isChunkFailure = 
      /Failed to fetch dynamically imported module/i.test(errorMsg) ||
      /Loading chunk.*failed/i.test(errorMsg) ||
      /Mime type/i.test(errorMsg) ||
      /Strict MIME type checking is enforced/i.test(errorMsg);

    if (isChunkFailure) {
      const now = Date.now();
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      
      // Prevent reload loop by enforcing a 10s cooldown
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem('last_chunk_reload', now.toString());
        console.warn('Outdated client bundle detected. Reloading page to sync latest changes...', error);
        window.location.reload();
        return;
      }
    }

    console.error(error);
  }
}
