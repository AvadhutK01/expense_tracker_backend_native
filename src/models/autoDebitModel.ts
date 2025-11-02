import mongoose from 'mongoose';
import { ICategory } from './categoriesModel';

export interface IAutoDebit extends mongoose.Document {
    amount: number;
    categoryToDeduct: ICategory['_id'];
    debitDateTime: Date;
}

const AutoDebitSchema = new mongoose.Schema<IAutoDebit>(
    {
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        categoryToDeduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        },
        debitDateTime: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const AutoDebit = mongoose.model<IAutoDebit>('AutoDebit', AutoDebitSchema);
export default AutoDebit;
