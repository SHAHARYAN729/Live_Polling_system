import mongoose, { Schema, Document } from 'mongoose';

export interface IOption {
  text: string;
  isCorrect: boolean;
  votes: number;
}

export interface IPollQuestion extends Document {
  text: string;
  options: IOption[];
  timer: number;
  questionNumber: number;
  totalVotes: number;
  sessionId: string;
  createdAt: Date;
  endedAt?: Date;
}

const OptionSchema = new Schema<IOption>({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false },
  votes: { type: Number, default: 0 },
});

const PollQuestionSchema = new Schema<IPollQuestion>({
  text: { type: String, required: true },
  options: { type: [OptionSchema], required: true },
  timer: { type: Number, required: true, default: 60 },
  questionNumber: { type: Number, required: true },
  totalVotes: { type: Number, default: 0 },
  sessionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  endedAt: { type: Date },
});

export const PollQuestion = mongoose.model<IPollQuestion>('PollQuestion', PollQuestionSchema);
