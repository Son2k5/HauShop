import { Link } from "react-router-dom";
import NotificationBell from "../../notification/NotificationBell";
import { ROUTES } from "../../../lib/routes";
import { CartIcon, HeartIcon } from "./HeaderIcons";

type HeaderActionsProps = {
  totalQty: number;
  iconButtonClass: string;
};

export default function HeaderActions({ totalQty, iconButtonClass }: HeaderActionsProps) {
  return (
    <>
      <NotificationBell buttonClassName={iconButtonClass} />

      <Link to={ROUTES.WISHLIST} className={iconButtonClass} aria-label="Yêu thích">
        <HeartIcon />
      </Link>

      <Link to={ROUTES.CART} className={iconButtonClass} aria-label="Giỏ hàng">
        <CartIcon />
        {totalQty > 0 && (
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white xl:h-5 xl:min-w-5">
            {totalQty > 99 ? "99+" : totalQty}
          </span>
        )}
      </Link>
    </>
  );
}
