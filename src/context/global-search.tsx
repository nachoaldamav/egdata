import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import lodash from 'lodash';
import { Portal } from '@radix-ui/react-portal';
import { client } from '~/lib/client';
import { defaultState, SearchContext } from './search-context';
import { internalNamespaces } from '~/lib/internal-namespaces';
import { Link } from '@remix-run/react';
import { Input } from '~/components/ui/input';

const { debounce } = lodash;

interface Search {
  elements: Element[];
  total: number;
}

interface Element {
  _id: string;
  id: string;
  namespace: string;
  title: string;
  keyImages: KeyImage[];
}

interface KeyImage {
  type: string;
  url: string;
  md5: string;
}

export interface SearchState {
  focus: boolean;
  query: string;
  results: Element[];
  inputRef: React.RefObject<HTMLInputElement>;
  setQuery: (query: string) => void;
  setFocus: (focus: boolean) => void;
}

interface SearchProviderProps {
  children: ReactNode;
}

function SearchProvider({ children }: SearchProviderProps) {
  const [searchState, setSearchState] = useState<SearchState>(defaultState);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (!query || query === '') {
        setSearchState((prevState) => ({
          ...prevState,
          results: [],
        }));
        return;
      }

      client
        .get<Search>('/autocomplete', {
          params: { query },
        })
        .then(({ data }) => {
          setSearchState((prevState) => ({
            ...prevState,
            results: data.elements,
          }));
        });
    }, 300), // 300ms debounce time
    [],
  );

  useEffect(() => {
    if (searchState.query) {
      debouncedSearch(searchState.query);
    }
  }, [searchState.query, debouncedSearch]);

  return (
    <SearchContext.Provider
      value={{
        ...searchState,
        setQuery: (query: string) =>
          setSearchState((prevState) => ({
            ...prevState,
            query,
          })),
        setFocus: (focus: boolean) =>
          setSearchState((prevState) => ({
            ...prevState,
            focus,
          })),
        inputRef,
      }}
    >
      {children}
      <Portal>
        {inputRef.current && searchState.results.length > 0 && searchState.query !== '' && (
          <div className="fixed top-0 right-0 z-10 w-full h-full bg-card/50 backdrop-blur-sm items-center justify-center flex">
            <span
              className="absolute top-0 left-0 w-full h-full cursor-pointer"
              onClick={() =>
                setSearchState((prevState) => ({
                  ...prevState,
                  focus: false,
                  query: '',
                  results: [],
                }))
              }
            />

            <div className="flex flex-col gap-4 p-4 w-full h-[75vh] xl:w-2/3 mx-auto bg-card rounded-xl z-10">
              <div className="w-full inline-flex justify-center items-center">
                <Input
                  type="text"
                  value={searchState.query}
                  className="w-1/3 h-12 p-4 bg-card text-white"
                  onClick={() => {
                    inputRef.current?.focus();
                  }}
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <section id="offers-results">
                  <h5 className="text-xl font-bold text-center">Offers</h5>
                  <div className="flex flex-col gap-2 mt-4">
                    {searchState.results.map((result) => (
                      <Link key={result.id} to={`/offers/${result.id}`}>
                        <span className="text-sm font-bold text-center">{result.title}</span>
                      </Link>
                    ))}
                  </div>
                </section>
                <section id="items-results">
                  <h5 className="text-xl font-bold text-center">Items</h5>
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-sm font-bold text-center">No items available</span>
                  </div>
                </section>
                <section id="sellers-results">
                  <h5 className="text-xl font-bold text-center">Sellers</h5>
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-sm font-bold text-center">No sellers available</span>
                  </div>
                </section>
                <section id="users-results">
                  <h5 className="text-xl font-bold text-center">Users</h5>
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-sm font-bold text-center">No users available</span>
                  </div>
                </section>
              </div>
            </div>
          </div>
        )}
      </Portal>
    </SearchContext.Provider>
  );
}

export { SearchProvider };
