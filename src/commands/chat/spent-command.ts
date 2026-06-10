import { ChatInputCommandInteraction, PermissionsString } from 'discord.js';

import { CapePurchase } from '../../models/cape-purchase-models.js';
import { Language } from '../../models/enum-helpers/index.js';
import { EventData } from '../../models/internal-models.js';
import { CapePurchaseLoadError, CapePurchaseService, Lang } from '../../services/index.js';
import { InteractionUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../index.js';

const MAX_PURCHASE_FIELDS = 23;

export class SpentCommand implements Command {
    public names = [Lang.getRef('chatCommands.spent', Language.Default)];
    public deferType = CommandDeferType.HIDDEN;
    public requireClientPerms: PermissionsString[] = [];

    constructor(private capePurchaseService: CapePurchaseService) {}

    public async execute(intr: ChatInputCommandInteraction, data: EventData): Promise<void> {
        let purchaseData: Awaited<ReturnType<CapePurchaseService['loadPurchases']>>;
        try {
            purchaseData = await this.capePurchaseService.loadPurchases();
        } catch (error) {
            if (error instanceof CapePurchaseLoadError) {
                let location =
                    error.code === 'MISSING'
                        ? 'errorEmbeds.spentDataMissing'
                        : 'errorEmbeds.spentDataInvalid';
                await InteractionUtils.send(intr, Lang.getEmbed(location, data.lang));
                return;
            }
            throw error;
        }

        let { purchases, currency } = purchaseData;
        if (purchases.length === 0) {
            await InteractionUtils.send(intr, Lang.getEmbed('displayEmbeds.spentEmpty', data.lang));
            return;
        }

        let title = purchaseData.title ?? Lang.getRef('spent.defaultTitle', data.lang);
        let embed = Lang.getEmbed('displayEmbeds.spent', data.lang, {
            TITLE: title,
        });

        let shown = purchases.slice(0, MAX_PURCHASE_FIELDS);
        for (let purchase of shown) {
            embed.addFields({
                name: this.formatPurchaseName(purchase, data.lang),
                value: this.formatPurchaseValue(purchase, currency, data.lang),
            });
        }

        if (purchases.length > MAX_PURCHASE_FIELDS) {
            embed.addFields({
                name: Lang.getRef('spent.truncatedName', data.lang),
                value: Lang.getRef('spent.truncatedValue', data.lang, {
                    SHOWN: shown.length.toLocaleString(data.lang),
                    TOTAL: purchases.length.toLocaleString(data.lang),
                }),
            });
        }

        let total = this.capePurchaseService.getTotal(purchases);
        embed.addFields({
            name: Lang.getRef('spent.totalName', data.lang),
            value: this.capePurchaseService.formatAmount(total, currency, data.lang),
        });

        await InteractionUtils.send(intr, embed);
    }

    private formatPurchaseName(purchase: CapePurchase, _locale: string): string {
        let prefix = purchase.id != null ? `#${purchase.id}` : purchase.item;
        return prefix.length > 256 ? prefix.slice(0, 253) + '...' : prefix;
    }

    private formatPurchaseValue(purchase: CapePurchase, currency: string, locale: string): string {
        let parts: string[] = [];
        if (purchase.id != null) {
            parts.push(purchase.item);
        }
        parts.push(this.capePurchaseService.formatAmount(purchase.amount, currency, locale));
        if (purchase.date) {
            parts.push(purchase.date);
        }
        if (purchase.note) {
            parts.push(purchase.note);
        }
        let value = parts.join(' · ');
        return value.length > 1024 ? value.slice(0, 1021) + '...' : value;
    }
}
