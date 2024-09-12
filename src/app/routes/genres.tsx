import type { LoaderFunction, LoaderFunctionArgs } from '@remix-run/node';
import { Link, type MetaFunction, useLoaderData } from '@remix-run/react';
import { httpClient } from '~/lib/http-client';
import { cn } from '~/lib/utils';

type GenresRes = Genre[];

interface Genre {
  genre: Genre;
  offers: Offer[];
}

interface Genre {
  id: string;
  name: string;
  aliases: string[];
}

interface Offer {
  id: string;
  title: string;
  image: Image;
}

interface Image {
  type: string;
  url: string;
  md5: string;
}

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Genres - egdata.app',
    },
    {
      name: 'description',
      content: 'Explore games by genre.',
    },
    {
      name: 'keywords',
      content: 'genres, games, video games, explore',
    },
  ];
};

export const loader: LoaderFunction = async () => {
  const genres = await httpClient.get<GenresRes>('/offers/genres');

  return {
    genres: genres,
  };
};

export default function GenresPage() {
  const { genres } = useLoaderData<typeof loader>();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-2xl font-bold">Genres</h1>
      <hr className="w-1/2 bg-gray-800 my-4" />
      <div className="flex flex-wrap justify-center">
        {genres
          .filter((genre) => genre.genre?.id)
          .map((genre) => (
            <GenreCard key={genre.genre?.id} genre={genre} />
          ))}
      </div>
    </main>
  );
}

function GenreCard({ genre }: { genre: Genre }) {
  return (
    <Link
      to={`/search?tags=${genre.genre.id}&sort_by=releaseDate`}
      className="genre-card relative w-72 h-[300px] text-white overflow-hidden rounded-lg shadow-lg m-4 bg-gray-900/40 hover:bg-gray-900/60 transition group"
    >
      <div className="title absolute bottom-2 w-full text-center font-semibold text-xl z-10">
        {genre.genre.name}
      </div>
      <span className="absolute top-0 left-0 w-full h-full backdrop-blur-[1px] bg-black/10 z-[5] group-hover:opacity-0 transition duration-300 ease-in-out" />
      {genre.offers.map((offer, index) => (
        <img
          key={offer.id}
          src={`${offer.image.url}?w=240&resize=1&quality=high`}
          alt={offer.title}
          className={cn(
            'absolute w-40 h-56 object-cover rounded shadow-2xl',
            index === 1 && 'left-2 z-0 opacity-35 backdrop-filter backdrop-blur-lg top-4',
            index === 0 &&
              'left-1/2 transform -translate-x-1/2 z-10 w-44 h-60 top-2 group-hover:scale-[1.03] transition duration-200 ease-in-out',
            index === 2 && 'right-2 z-0 opacity-35 backdrop-filter backdrop-blur-lg top-4',
          )}
        />
      ))}
    </Link>
  );
}
