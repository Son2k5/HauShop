import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import React from 'react';

interface NavProp {
  title: string;
  icons: boolean;
}
const NavTitle: React.FC<NavProp> = ({ title, icons }) => {
  return (
    <div className="flex items-center justify-between pb-5">
      {icons ? (
        <>
          <h3 className="font-bold lg:text-xl text-primeColor">{title}</h3>
          {icons && <ArrowDropDownIcon />}
        </>
      ) : (
        <>
          <h3 className="font-bold lg:text-xl text-primeColor">{title}</h3>
        </>
      )}
    </div>
  );
};
export default NavTitle;
