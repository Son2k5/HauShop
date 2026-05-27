import type { ChangeEvent, KeyboardEvent, RefObject } from "react";
import type { ProductSummaryDto } from "../../../@types/product.type";
import { formatPrice } from "../../../utils/formatPrice";
import { CloseIcon, SearchIcon } from "./HeaderIcons";

type HeaderSearchProps = {
  mode: "desktop" | "mobile";
  inputRef: RefObject<HTMLInputElement | null>;
  searchBoxRef?: RefObject<HTMLDivElement | null>;
  searchQuery: string;
  showSuggestions: boolean;
  suggestions: ProductSummaryDto[];
  suggestionsLoading: boolean;
  onQueryChange: (value: string) => void;
  onSuggestionsChange: (value: boolean) => void;
  onSubmit: () => void;
  onSuggestionClick: (slug: string) => void;
  onCloseMobile?: () => void;
};

function SuggestionsList({
  searchQuery,
  suggestions,
  suggestionsLoading,
  onSubmit,
  onSuggestionClick,
  className,
}: {
  searchQuery: string;
  suggestions: ProductSummaryDto[];
  suggestionsLoading: boolean;
  onSubmit: () => void;
  onSuggestionClick: (slug: string) => void;
  className: string;
}) {
  if (searchQuery.trim().length < 2) return null;

  return (
    <div className={className}>
      {suggestionsLoading ? (
        <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
      ) : suggestions.length > 0 ? (
        <div className="py-2">
          {suggestions.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSuggestionClick(product.slug)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-gray-50"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">No img</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatPrice(product.minVariantPrice ?? product.price)}
                </p>
              </div>
            </button>
          ))}
          <button
            type="button"
            onClick={onSubmit}
            className="w-full border-t border-gray-100 px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50"
          >
            View all results for "{searchQuery.trim()}"
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
      )}
    </div>
  );
}

export default function HeaderSearch({
  mode,
  inputRef,
  searchBoxRef,
  searchQuery,
  showSuggestions,
  suggestions,
  suggestionsLoading,
  onQueryChange,
  onSuggestionsChange,
  onSubmit,
  onSuggestionClick,
  onCloseMobile,
}: HeaderSearchProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      onSubmit();
      return;
    }

    if (mode === "mobile" && event.key === "Escape") {
      onCloseMobile?.();
    }
  };

  const inputProps = {
    ref: inputRef,
    type: "text",
    placeholder: "What are you looking for?",
    value: searchQuery,
    onChange: (event: ChangeEvent<HTMLInputElement>) => {
      onQueryChange(event.target.value);
      onSuggestionsChange(true);
    },
    onFocus: () => {
      if (searchQuery.trim().length >= 2) {
        onSuggestionsChange(true);
      }
    },
    onKeyDown: handleKeyDown,
    style: { fontFamily: "Poppins, sans-serif" },
  };

  if (mode === "mobile") {
    return (
      <div className="border-t border-gray-100 pb-4 pt-3 lg:hidden">
        <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5">
          <input
            {...inputProps}
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onSubmit}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-500"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {showSuggestions && (
          <SuggestionsList
            searchQuery={searchQuery}
            suggestions={suggestions}
            suggestionsLoading={suggestionsLoading}
            onSubmit={onSubmit}
            onSuggestionClick={onSuggestionClick}
            className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg"
          />
        )}
      </div>
    );
  }

  return (
    <div
      ref={searchBoxRef}
      className="relative flex h-11 items-center rounded-full border border-transparent bg-gray-100 px-4 transition-all duration-200 focus-within:border-red-400 focus-within:bg-white"
    >
      <input
        {...inputProps}
        className="w-40 appearance-none border-none bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400 focus:outline-none focus:ring-0 xl:w-56 2xl:w-72"
      />

      <button
        type="button"
        onClick={onSubmit}
        className="ml-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-200 hover:text-red-500"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      {showSuggestions && (
        <SuggestionsList
          searchQuery={searchQuery}
          suggestions={suggestions}
          suggestionsLoading={suggestionsLoading}
          onSubmit={onSubmit}
          onSuggestionClick={onSuggestionClick}
          className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_18px_45px_rgba(0,0,0,0.12)]"
        />
      )}
    </div>
  );
}
