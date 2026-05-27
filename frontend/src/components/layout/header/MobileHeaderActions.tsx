import { MenuIcon, SearchIcon } from "./HeaderIcons";

type MobileHeaderActionsProps = {
  iconButtonClass: string;
  showSearchBar: boolean;
  showMobileMenu: boolean;
  onToggleSearch: () => void;
  onToggleMenu: () => void;
};

export default function MobileHeaderActions({
  iconButtonClass,
  showSearchBar,
  showMobileMenu,
  onToggleSearch,
  onToggleMenu,
}: MobileHeaderActionsProps) {
  return (
    <div className="flex items-center gap-1 lg:hidden">
      <button onClick={onToggleSearch} className={iconButtonClass} aria-label="Toggle search">
        <SearchIcon />
        <span className="sr-only">{showSearchBar ? "Close search" : "Open search"}</span>
      </button>

      <button
        data-mobile-toggle
        onClick={onToggleMenu}
        className={iconButtonClass}
        aria-label="Toggle menu"
        aria-expanded={showMobileMenu}
      >
        <MenuIcon />
      </button>
    </div>
  );
}

