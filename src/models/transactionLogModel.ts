import mongoose, { Schema, Document } from 'mongoose';

export interface ITransactionLog extends Document {
  categoryId: mongoose.Types.ObjectId;
  categoryName: string;
  changeType: 'add' | 'subtract';
  changeAmount: number;
  previousAmount: number;
  newAmount: number;
  createdAt: Date;
}

const TransactionLogSchema = new Schema<ITransactionLog>(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
      trim: true,
    },
    changeType: {
      type: String,
      enum: ['add', 'subtract'],
      required: true,
    },
    changeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    previousAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    newAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '2d',
    },
  },
  { timestamps: true }
);

const TransactionLog = mongoose.model<ITransactionLog>('TransactionLog', TransactionLogSchema);
export default TransactionLog;
