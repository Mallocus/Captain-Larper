export interface CapePurchase {
    id?: number;
    item: string;
    amount: number;
    date?: string;
    note?: string;
}

export interface CapePurchaseData {
    title?: string;
    currency?: string;
    purchases: CapePurchase[];
}
