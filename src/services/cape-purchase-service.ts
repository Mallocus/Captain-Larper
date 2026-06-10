import { readFile } from 'node:fs/promises';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { CapePurchase, CapePurchaseData } from '../models/cape-purchase-models.js';

const DATA_FILE = path.resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../data/cape-purchases.json'
);

export class CapePurchaseLoadError extends Error {
    constructor(
        message: string,
        public readonly code: 'MISSING' | 'INVALID'
    ) {
        super(message);
        this.name = 'CapePurchaseLoadError';
    }
}

export class CapePurchaseService {
    public async loadPurchases(): Promise<CapePurchaseData> {
        let raw: string;
        try {
            raw = await readFile(DATA_FILE, 'utf8');
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
                throw new CapePurchaseLoadError('Purchase data file not found.', 'MISSING');
            }
            throw error;
        }

        let data: CapePurchaseData;
        try {
            data = JSON.parse(raw) as CapePurchaseData;
        } catch {
            throw new CapePurchaseLoadError('Purchase data file is invalid.', 'INVALID');
        }

        if (!data.purchases || !Array.isArray(data.purchases)) {
            throw new CapePurchaseLoadError('Purchase data file is invalid.', 'INVALID');
        }

        return {
            title: data.title,
            currency: data.currency ?? 'USD',
            purchases: data.purchases,
        };
    }

    public getTotal(purchases: CapePurchase[]): number {
        return purchases.reduce((sum, purchase) => sum + purchase.amount, 0);
    }

    public formatAmount(amount: number, currency: string, locale: string): string {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency,
            }).format(amount);
        } catch {
            return `${currency} ${amount.toFixed(2)}`;
        }
    }
}
