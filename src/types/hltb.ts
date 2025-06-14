export interface Hltb {
  _id: string;
  __v: number;
  created: string;
  detailedTimes: DetailedTime[];
  gameTimes: GameTime[];
  hltbId: string;
  updated: string;
}

export interface DetailedTime {
  type: string;
  average: string;
  median: string;
  rushed: string;
  leisure: string;
  _id: string;
}

export interface GameTime {
  category: string;
  time: string;
  _id: string;
}
