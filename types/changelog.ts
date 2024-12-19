export interface Change {
  changeType: 'update' | 'insert' | 'delete';
  field: string;
  oldValue: any;
  newValue: any;
}

export interface ChangeMetadata {
  contextType: string;
  contextId: string;
  changes: Change[];
}

export interface ChangeRecord {
  _id: string;
  timestamp: string;
  metadata: ChangeMetadata;
  __v: number;
}
