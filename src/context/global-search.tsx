import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import lodash from 'lodash';
import { Portal } from '@radix-ui/react-portal';
import { client } from '~/lib/client';
import { defaultState, SearchContext } from './search-context';
import { internalNamespaces } from '~/lib/internal-namespaces';
import { Link } from '@remix-run/react';

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
    []
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
        {inputRef.current &&
          searchState.results.length > 0 &&
          searchState.query !== '' && (
            <div
              className="absolute bg-gray-900 rounded-lg shadow-lg w-auto"
              style={{
                top:
                  inputRef.current.getBoundingClientRect().bottom +
                  window.scrollY +
                  10,
                left:
                  inputRef.current.getBoundingClientRect().left +
                  window.scrollX,
                width: inputRef.current.offsetWidth,
              }}
            >
              <div className="p-4 space-y-4 max-h-[400px] overflow-auto">
                {searchState.results.map((result) => (
                  <Link
                    key={result.id}
                    className="flex items-center gap-4 border-b border-gray-800 py-2"
                    to={`/offers/${result.id}`}
                    onClick={() => setSearchState(defaultState)}
                  >
                    <div className="inline-flex relative justify-start items-center gap-4">
                      <h3 className="font-medium">{result.title}</h3>
                      {internalNamespaces.includes(result.namespace) && (
                        <span className="text-sm text-gray-400">Internal</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
      </Portal>
    </SearchContext.Provider>
  );
}

export { SearchProvider };
