import mongoose from 'mongoose';

export interface ICategory extends mongoose.Document {
  name: string;
  amount: number;
  isAddToSavings: boolean;
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
    isAddToSavings: {
      type: Boolean,
      default: true,
      required: false
    }
  },
  {
    timestamps: true,
  }
);

const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
