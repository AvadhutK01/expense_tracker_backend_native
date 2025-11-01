import mongoose from 'mongoose';

export interface INote extends mongoose.Document {
  content: string;
}

const NoteSchema = new mongoose.Schema<INote>(
  {
    content: {
      type: String,
      required: false,
      default: ''
    },
  },
  {
    timestamps: true,
  }
);

const Note = mongoose.model<INote>('Note', NoteSchema);
export default Note;
