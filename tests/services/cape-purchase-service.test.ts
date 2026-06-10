import { describe, expect, it } from 'vitest';

import { CapePurchaseService } from '../../src/services/cape-purchase-service.js';

describe('CapePurchaseService', () => {
    let service = new CapePurchaseService();

    describe('getTotal', () => {
        it('should sum purchase amounts', () => {
            let total = service.getTotal([
                { item: 'Cape A', amount: 10 },
                { item: 'Cape B', amount: 25.5 },
                { item: 'Cape C', amount: 4.5 },
            ]);
            expect(total).toBe(40);
        });

        it('should return 0 for an empty list', () => {
            expect(service.getTotal([])).toBe(0);
        });
    });

    describe('formatAmount', () => {
        it('should format USD amounts', () => {
            let formatted = service.formatAmount(29.99, 'USD', 'en-US');
            expect(formatted).toContain('29.99');
        });
    });
});
