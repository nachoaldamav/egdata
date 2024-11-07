export interface Tag {
  id: string;
  name: string;
}

export interface FullTag extends Tag {
  aliases: string[];
  status: string;
  groupName: string;
}

export type TagCount = {
  _id: string;
  count: number;
};
