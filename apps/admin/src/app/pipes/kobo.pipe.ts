import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'kobo' })
export class KoboPipe implements PipeTransform {
  transform(value: number): string {
    const naira = value / 100;
    return naira.toLocaleString('en-NG', { style: 'currency', currency: 'NGN' });
  }
}
