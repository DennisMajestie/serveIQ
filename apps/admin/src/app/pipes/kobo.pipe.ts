import { Pipe, PipeTransform, inject } from '@angular/core';
import { CurrencyContextService } from '../core/currency-context.service';

@Pipe({ name: 'kobo', pure: false })
export class KoboPipe implements PipeTransform {
  private currency = inject(CurrencyContextService);

  transform(value: number): string {
    return this.currency.formatKobo(value);
  }
}
