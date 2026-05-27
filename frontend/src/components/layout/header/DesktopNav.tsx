import { Link } from "react-router-dom";
import type { HeaderNavLink } from "./headerLinks";

type DesktopNavProps = {
  navLinks: HeaderNavLink[];
  pathname: string;
  isAuthenticated: boolean;
  isAdmin: boolean;
  adminToggleTarget: string;
  adminToggleLabel: string;
};

export default function DesktopNav({
  navLinks,
  pathname,
  isAuthenticated,
  isAdmin,
  adminToggleTarget,
  adminToggleLabel,
}: DesktopNavProps) {
  const desktopNavClass = (path: string) =>
    `relative text-sm xl:text-[15px] 2xl:text-base font-medium tracking-[0.2px] transition-colors duration-200 whitespace-nowrap ${
      pathname === path ? "text-red-500" : "text-gray-800 hover:text-red-500"
    }`;

  return (
    <nav className="hidden items-center gap-5 lg:flex xl:gap-7 2xl:gap-9">
      {navLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={desktopNavClass(link.path)}
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {link.name}
          {pathname === link.path && (
            <span className="absolute -bottom-[23px] left-0 h-[2px] w-full rounded-full bg-red-500 lg:-bottom-[27px] 2xl:-bottom-[30px]" />
          )}
        </Link>
      ))}

      {!isAuthenticated && (
        <Link
          to="/signup"
          className="text-sm font-medium text-gray-800 transition-colors duration-200 hover:text-red-500 xl:text-[15px] 2xl:text-base"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Sign Up
        </Link>
      )}

      {isAdmin && (
        <Link
          to={adminToggleTarget}
          className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition-colors duration-200 hover:border-red-500 hover:text-red-500 xl:text-[15px] 2xl:text-base"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {adminToggleLabel}
        </Link>
      )}
    </nav>
  );
}

