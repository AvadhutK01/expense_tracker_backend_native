import { Request, Response, NextFunction } from 'express';
import CategoryModel, { ICategory as ICat } from '../models/categoriesModel.js';
import RecurringCategoryModel from '../models/recurringCategoriesModel.js';

// DTO for incoming category data
interface CategoryInput {
    name: string;
    amount: number;
}

interface UpdateCategoriesRequestBody {
    mode: 'permanent' | 'temporary';  // extra input
    categories: CategoryInput[];
}

interface UpdateSingleCategoryInput {
    name: string;
    amount: number;
    type: 'add' | 'subtract';
}


/**
 * Clears existing entries and initializes both Category and RecurringCategory collections.
 * Ensures "loan" category exists and names are unique.
 */
export async function initiateCategories(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const inputs: CategoryInput[] = req.body;

        if (!inputs.some((c) => c.name.toLowerCase() === 'loan' || !inputs.some((c) => c.name.toLowerCase() === 'savings'))) {
            res.status(400).json({ message: 'The "loan" or "savings" category is required.' });
            return;
        }

        const seen = new Set<string>();
        for (const cat of inputs) {
            const key = cat.name.trim().toLowerCase();
            if (seen.has(key)) {
                res.status(400).json({ message: `Duplicate category: ${cat.name}` });
                return;
            }
            seen.add(key);
        }

        await Promise.all([
            CategoryModel.deleteMany({}),
            RecurringCategoryModel.deleteMany({}),
        ]);

        const docs = inputs.map((c) => ({ name: c.name.trim(), amount: c.amount }));

        // Insert all categories into CategoryModel
        const categories = await CategoryModel.insertMany(docs);

        // Filter out "loan" for recurring categories
        const recurringDocs = docs.filter((c) => c.name.trim().toLowerCase() !== 'loan');
        const recurring = await RecurringCategoryModel.insertMany(recurringDocs);

        res.status(201).json({
            message: 'Categories initialized successfully.',
            count: categories.length,
        });
        return;
    } catch (err) {
        console.error('initiateCategories message:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
}

export async function addNewCategories(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const inputs: CategoryInput[] = req.body;

        if (!Array.isArray(inputs) || inputs.length === 0) {
            res.status(400).json({ message: 'Input must be a non-empty array' });
            return;
        }

        const categoryCount = await CategoryModel.countDocuments();
        const recurringCount = await RecurringCategoryModel.countDocuments();

        if (categoryCount === 0 || recurringCount === 0) {
            res.status(400).json({
                message:
                    'Categories not initialized yet. Please call initiateCategories API first.',
            });
            return;
        }

        const seen = new Set<string>();
        for (const cat of inputs) {
            const key = cat.name.trim().toLowerCase();
            if (seen.has(key)) {
                res.status(400).json({ message: `Duplicate category in input: ${cat.name}` });
            }
            seen.add(key);
        }

        const namesToCheck = inputs.map(c => c.name.trim());

        const regexQueries = namesToCheck.map(name => new RegExp(`^${name}$`, 'i'));

        const existingCategories = await CategoryModel.find({
            name: { $in: regexQueries },
        }).lean();

        const existingRecurring = await RecurringCategoryModel.find({
            name: { $in: regexQueries },
        }).lean();

        if (existingCategories.length > 0 || existingRecurring.length > 0) {
            const existingNames = [
                ...existingCategories.map(c => c.name),
                ...existingRecurring.map(c => c.name),
            ];
            res.status(400).json({
                message: `Categories already exist: ${[...new Set(existingNames)].join(', ')}`,
            });
            return;
        }

        const docs = inputs.map(c => ({ name: c.name.trim(), amount: c.amount }));
        console.log(docs);

        await Promise.all([
            CategoryModel.insertMany(docs),
            RecurringCategoryModel.insertMany(docs),
        ]);

        res.status(201).json({
            message: 'New categories added successfully',
            count: docs.length,
        });
        return;
    } catch (err) {
        console.error('addNewCategories message:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
}

export async function updateCategories(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { mode, categories }: UpdateCategoriesRequestBody = req.body;

        if (!Array.isArray(categories) || categories.length === 0) {
            res.status(400).json({ message: 'Categories array is required and cannot be empty.' });
            return;
        }

        if (mode !== 'permanent' && mode !== 'temporary') {
            res.status(400).json({ message: 'Mode must be either "permanent" or "temporary".' });
            return;
        }

        const modelToUpdate = mode === 'permanent' ? RecurringCategoryModel : CategoryModel;

        // Normalize names and check duplicates in input
        const seen = new Set<string>();
        for (const cat of categories) {
            const key = cat.name.trim().toLowerCase();
            if (seen.has(key)) {
                res.status(400).json({ message: `Duplicate category in input: ${cat.name}` });
                return;
            }
            seen.add(key);
        }

        // Update each category by name, if it exists
        const updatePromises = categories.map(({ name, amount }) =>
            modelToUpdate.findOneAndUpdate(
                { name: new RegExp(`^${name.trim()}$`, 'i') },
                { amount },
                { new: true }
            )
        );

        const updatedDocs = await Promise.all(updatePromises);

        // Check which categories were not found
        const notFound = categories
            .map((c, idx) => ({ cat: c, updated: updatedDocs[idx] }))
            .filter(({ updated }) => !updated)
            .map(({ cat }) => cat.name);

        if (notFound.length > 0) {
            res.status(404).json({
                message: `Categories not found for update: ${notFound.join(', ')}`,
            });
            return;
        }

        res.status(200).json({
            message: `Categories updated successfully in ${mode} mode.`,
            updatedCount: updatedDocs.length,
        });
        return;
    } catch (err) {
        console.error('updateCategories message:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
}

export async function updateSingleCategory(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { name, amount, type }: UpdateSingleCategoryInput = req.body;

        if (!name || typeof amount !== 'number' || !['add', 'subtract'].includes(type)) {
            res.status(400).json({ message: 'Invalid input: name, amount, and type ("add" or "subtract") are required.' });
            return;
        }

        if (amount < 0) {
            res.status(400).json({ message: 'Amount must be non-negative.' });
            return;
        }

        const category = await CategoryModel.findOne({ name: new RegExp(`^${name.trim()}$`, 'i') });

        if (!category) {
            res.status(404).json({ message: `Category "${name}" not found.` });
            return;
        }

        let newAmount: number;
        if (type === 'add') {
            newAmount = category.amount + amount;
        } else { // subtract
            newAmount = category.amount - amount;
            if (newAmount < 0) {
                res.status(400).json({ message: `Subtraction would result in negative amount for category "${name}".` });
                return;
            }
        }

        category.amount = newAmount;
        await category.save();

        res.status(200).json({
            message: `Category "${name}" updated successfully.`,
            category: { name: category.name, amount: category.amount },
        });
        return;
    } catch (err) {
        console.error('updateSingleCategory message:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
}

/**
 * Fetches all categories from the CategoryModel.
 */
export async function getAllCategories(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { type = '' } = req.query;
        console.log({type});
        let categories = [];

        if(type === 'recurring'){
            categories = await RecurringCategoryModel.find().lean()
        }
        else{
            categories = await CategoryModel.find().lean()
        }

        res.status(200).json({
            message: 'Fetched all categories successfully.',
            count: categories.length,
            categories,
        });
        return;
    } catch (err) {
        console.error('getAllCategories message:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
}

export async function payLoanAmount(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const { name, amount }: CategoryInput = req.body;

        // ----- validation -----
        if (!name || typeof name !== 'string') {
            res
                .status(400)
                .json({ message: 'Invalid input: "name" (string) is required.' });
            return;
        }
        if (typeof amount !== 'number' || isNaN(amount)) {
            res
                .status(400)
                .json({ message: 'Invalid input: "amount" (number) is required.' });
            return;
        }
        if (amount <= 0) {
            res
                .status(400)
                .json({ message: '"amount" must be greater than zero.' });
            return;
        }

        // ----- fetch documents -----
        // target category
        const category = await CategoryModel.findOne({
            name: new RegExp(`^${name.trim()}$`, 'i'),
        });
        if (!category) {
            res
                .status(404)
                .json({ message: `Category "${name}" not found.` });
            return;
        }
        // loan category
        const loanCat = await CategoryModel.findOne({
            name: new RegExp(`^loan$`, 'i'),
        });
        if (!loanCat) {
            res
                .status(500)
                .json({ message: 'Internal message: "loan" category missing.' });
            return;
        }

        // ----- edge‑case checks -----
        if (category.amount < amount) {
            res.status(400).json({
                message: `Insufficient funds in "${category.name}". Current: ${category.amount}, requested: ${amount}.`,
            });
            return;
        }
        if (loanCat.amount < amount) {
            res.status(400).json({
                message: `Insufficient funds in "loan". Current: ${loanCat.amount}, requested: ${amount}.`,
            });
            return;
        }

        // ----- perform updates -----
        category.amount -= amount;
        loanCat.amount -= amount;

        await Promise.all([category.save(), loanCat.save()]);

        res.status(200).json({
            message: `Paid ${amount} from "${category.name}" and "loan" successfully.`,
            categories: [
                { name: category.name, amount: category.amount },
                { name: loanCat.name, amount: loanCat.amount },
            ],
        });
        return;
    } catch (err) {
        console.error('payLoanAmount message:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
}

export async function cronController(
    req: Request,
    res: Response,
    next: NextFunction
) {
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
        res.status(200).json({
            message: "cron ran succesfully!"
        });
        return;
    } catch (err) {
        console.error('Error running monthly recurring update:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
}

export const bankEmiDebitCron = async (req: Request,
    res: Response,
    next: NextFunction) => {
    try {
        const debitAmount = 965;

        // Debit from "savings"
        const updatedSavings = await CategoryModel.findOneAndUpdate(
            { name: /^savings$/i },
            { $inc: { amount: -debitAmount } },
            { new: true }
        );

        if (!updatedSavings) {
            console.warn('[Bank EMI Debit] "savings" category not found.');
        } else {
            console.log(`[Bank EMI Debit] Debited ${debitAmount} from "savings". New amount: ${updatedSavings.amount}`);
        }

        // Debit from "loan"
        const updatedLoan = await CategoryModel.findOneAndUpdate(
            { name: /^loan$/i },
            { $inc: { amount: -debitAmount } },
            { new: true }
        );

        if (!updatedLoan) {
            console.warn('[Bank EMI Debit] "loan" category not found.');
        } else {
            console.log(`[Bank EMI Debit] Debited ${debitAmount} from "loan". New amount: ${updatedLoan.amount}`);
        }
        res.status(200).json({
            message: "cron ran succesfully!"
        });
        return;
    } catch (err) {
        console.error('Error running bank EMI debit cron:', err);
        console.error('Error running monthly recurring update:', err);
        res.status(500).json({
            message: 'Something went wrong!'
        })
        return;
    }
};