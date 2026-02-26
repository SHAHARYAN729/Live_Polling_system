import type { Request, Response } from 'express';
import { PollQuestion } from '../models/PollQuestion';

export async function getHistory(_req: Request, res: Response) {
  try {
    const questions = await PollQuestion.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: questions });
  } catch (_err) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
}

export async function healthCheck(_req: Request, res: Response) {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
}
