export interface IgdbOffer {
  _id: string;
  offerId: string;
  igdbId: number;
  igdbName: string;
  igdbSlug: string;
  createdAt: string;
  updatedAt: string;
  cover: Cover;
  id: number;
  age_ratings: number[];
  aggregated_rating: number;
  aggregated_rating_count: number;
  alternative_names: number[];
  artworks: number[];
  category: number;
  created_at: number;
  external_games: number[];
  first_release_date: number;
  game_engines: number[];
  game_modes: number[];
  genres: number[];
  hypes: number;
  involved_companies: number[];
  keywords: number[];
  name: string;
  platforms: number[];
  player_perspectives: number[];
  rating: number;
  rating_count: number;
  release_dates: number[];
  screenshots: number[];
  similar_games: number[];
  slug: string;
  summary: string;
  tags: number[];
  themes: number[];
  total_rating: number;
  total_rating_count: number;
  updated_at: number;
  url: string;
  videos: number[];
  websites: Website[];
  checksum: string;
  language_supports: number[];
  game_localizations: number[];
  game_type: number;
  externalGameSources: ExternalGameSource[];
}

export interface Cover {
  id: number;
  alpha_channel: boolean;
  animated: boolean;
  game: number;
  height: number;
  image_id: string;
  url: string;
  width: number;
  checksum: string;
}

export interface Website {
  id: number;
  category: number;
  game: number;
  trusted: boolean;
  url: string;
  checksum: string;
  type: number;
}

export interface ExternalGameSource {
  id: number;
  category: number;
  created_at: number;
  game: number;
  name: string;
  uid: string;
  updated_at: number;
  url: string;
  checksum: string;
  external_game_source: number;
  year?: number;
}
