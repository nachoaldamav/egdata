export interface Media {
  _id: string;
  images: Image[];
  namespace: string;
  videos: Video[];
  logo: string | null | undefined;
}

export interface Image {
  _id: string;
  src: string;
}

export interface Video {
  _id: string;
  outputs: Output[];
}

export interface Output {
  duration?: number;
  url: string;
  width?: number;
  height?: number;
  key: string;
  contentType: string;
  _id: string;
}
