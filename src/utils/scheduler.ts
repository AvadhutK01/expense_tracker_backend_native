// src/utils/scheduler.ts
import cron from 'node-cron';
import CategoryModel from '../models/categoriesModel.ts';
import RecurringCategoryModel from '../models/recurringCategoriesModel.ts';

/**
 * On the 6th of every month at 00:00,
 * add each recurringCategory.amount to its matching CategoryModel.amount
 */
export function scheduleMonthlyRecurringUpdate() {
    // ───────── cron pattern ─────────
    // ┌───────────── minute (0)
    // │ ┌───────────── hour (0)
    // │ │ ┌───────────── day of month (6)
    // │ │ │ ┌───────────── month (*)
    // │ │ │ │ ┌───────────── day of week (*)
    // │ │ │ │ │
    // * * * * *
    cron.schedule('0 0 6 * *', async () => {
        try {
            const allCategories = await CategoryModel.find().lean();

            let totalToSave = 0;
            for (const cat of allCategories) {
                const name = cat.name.trim().toLowerCase();
                if (name !== 'loan' && name !== 'savings') {
                    totalToSave += cat.amount;
                }
            }

            // Update savings category
            const savingsCategory = await CategoryModel.findOneAndUpdate(
                { name: /^savings$/i },
                { $inc: { amount: totalToSave } },
                { new: true }
            );

            if (!savingsCategory) {
                console.warn('[Update] No "savings" category found to update.');
            } else {
                console.log(`[Update] Transferred ${totalToSave} to "savings". New amount: ${savingsCategory.amount}`);
            }

            // Reset all categories except savings and loan to 0
            await CategoryModel.updateMany(
                { name: { $nin: [/^savings$/i, /^loan$/i] } },
                { $set: { amount: 0 } }
            );
            console.log('[Update] Reset amounts of all categories except "savings" and "loan" to 0.');

            // Apply recurring updates
            const recurringCats = await RecurringCategoryModel.find().lean();

            for (const rec of recurringCats) {
                const updated = await CategoryModel.findOneAndUpdate(
                    { name: new RegExp(`^${rec.name.trim()}$`, 'i') },
                    { $inc: { amount: rec.amount } },
                    { new: true }
                );

                if (!updated) {
                    console.warn(
                        `[Recurring Update] No matching category for "${rec.name}". Skipped.`
                    );
                } else {
                    console.log(
                        `[Recurring Update] "${rec.name}" increased by ${rec.amount}. New amount: ${updated.amount}`
                    );
                }
            }
        } catch (err) {
            console.error('Error running monthly recurring update:', err);
        }
    });

    console.log('Scheduled: Monthly recurring update on the 6th at 00:00');
}

