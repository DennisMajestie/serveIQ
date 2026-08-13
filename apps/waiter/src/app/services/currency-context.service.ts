import { Injectable, signal, computed, inject } from '@angular/core';
import { BusinessApiService } from '@serveiq/shared/data-access';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
  name: string;
  decimals: number;
}

const CURRENCY_METADATA: Record<string, CurrencyInfo> = {
  NGN: { code: 'NGN', symbol: '₦', locale: 'en-NG', name: 'Nigerian Naira', decimals: 2 },
  USD: { code: 'USD', symbol: '$', locale: 'en-US', name: 'US Dollar', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', locale: 'en-GB', name: 'British Pound', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', locale: 'de-DE', name: 'Euro', decimals: 2 },
  KES: { code: 'KES', symbol: 'KSh', locale: 'en-KE', name: 'Kenyan Shilling', decimals: 2 },
  GHS: { code: 'GHS', symbol: 'GH₵', locale: 'en-GH', name: 'Ghanaian Cedi', decimals: 2 },
  ZAR: { code: 'ZAR', symbol: 'R', locale: 'en-ZA', name: 'South African Rand', decimals: 2 },
};

const DEFAULT_CURRENCY = CURRENCY_METADATA['NGN'];

@Injectable({ providedIn: 'root' })
export class CurrencyContextService {
  private businessApi = inject(BusinessApiService);
  
  private _currency = signal<CurrencyInfo>(DEFAULT_CURRENCY);
  private _loaded = signal(false);
  private _vipSurchargePercent = signal(0);

  readonly currency = computed(() => this._currency());
  readonly loaded = computed(() => this._loaded());
  readonly vipSurchargePercent = computed(() => this._vipSurchargePercent());

  constructor() {
    this.loadCurrency();
  }

  private async loadCurrency(): Promise<void> {
    try {
      const business = await this.businessApi.getBusiness().toPromise();
      if (business?.currency) {
        this.setCurrency(business.currency);
      }
      if (business?.vipSurchargePercent != null) {
        this._vipSurchargePercent.set(Number(business.vipSurchargePercent));
      }
    } catch {
      // Keep default
    } finally {
      this._loaded.set(true);
    }
  }

  setCurrency(currencyCode: string): void {
    const info = CURRENCY_METADATA[currencyCode] ?? DEFAULT_CURRENCY;
    this._currency.set(info);
  }

  refreshCurrency(): void {
    this._loaded.set(false);
    this.loadCurrency();
  }

  formatKobo(kobo: number): string {
    const currency = this._currency();
    const amount = kobo / 100;
    return amount.toLocaleString(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
  }

  formatPlain(amount: number): string {
    const currency = this._currency();
    return amount.toLocaleString(currency.locale, {
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
  }

  formatNaira(amount: number): string {
    return this.formatPlain(amount);
  }

  formatAmount(amount: number): string {
    const currency = this._currency();
    return amount.toLocaleString(currency.locale, {
      style: 'currency',
      currency: currency.code,
      minimumFractionDigits: currency.decimals,
      maximumFractionDigits: currency.decimals,
    });
  }

  getSymbol(): string {
    return this._currency().symbol;
  }

  getCode(): string {
    return this._currency().code;
  }

  getLocale(): string {
    return this._currency().locale;
  }

  getName(): string {
    return this._currency().name;
  }
}