export interface ChangelogStats {
  dailyChanges: DailyChanges;
  weekdayChanges: WeekdayChanges;
  changeTypes: ChangeTypes;
  changeFields: ChangeFields;
}

type ChangeDayType = `${string}-${string}-${string}`;

export interface DailyChanges {
  [key: ChangeDayType]: number;
}

export interface WeekdayChanges {
  [key: string]: number;
}

export interface ChangeTypes {
  update: number;
  delete: number;
  insert: number;
}

export interface ChangeFields {
  [key: string]: number;
}
