export interface SinglePoll {
  _id: string;
  averageRating: number;
  pollResult: PollResult[];
}

export interface PollResult {
  id: number;
  tagId: number;
  pollDefinitionId: number;
  localizations: Localizations;
  total: number;
}

export interface Localizations {
  text: string;
  emoji: string;
  resultEmoji: string;
  resultTitle: string;
  resultText: string;
}
