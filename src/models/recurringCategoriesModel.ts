import mongoose from 'mongoose';

export interface ICategory extends mongoose.Document {
  name: string;
  amount: number;
}

const CategorySchema = new mongoose.Schema<ICategory>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model<ICategory>('RecurringCategory', CategorySchema);
export default Category;
