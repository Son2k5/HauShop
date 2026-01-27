import React from 'react';
import { Icon } from '@iconify/react';

interface NavProp {
  title: string;
  icons: boolean;
}

const NavTitle: React.FC<NavProp> = ({ title, icons }) => {
  return (
    <div className="flex items-center justify-between pb-5">
      <h3 className="font-bold lg:text-xl text-primeColor">{title}</h3>

      {icons && (
        <Icon
          icon="heroicons-outline:chevron-down"
          className="w-6 h-6 text-primeColor"
        />
      )}
    </div>
  );
};

export default NavTitle;
