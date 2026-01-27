import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import NavTitle from './NavTitle';

interface CategoryItem {
  _id: number;
  title: string;
  icons?: boolean;
}

const Category: React.FC = () => {
  const [openId, setOpenId] = useState<number | null>(null);

  const items: CategoryItem[] = [
    { _id: 990, title: 'New Arrivals', icons: true },
    { _id: 991, title: 'Gadgets' },
    { _id: 992, title: 'Accessories', icons: true },
    { _id: 993, title: 'Electronics' },
    { _id: 994, title: 'Others' },
  ];

  const handleToggle = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="w-full">
      <NavTitle title="Shop by Category" icons={false} />

      <ul className="flex flex-col gap-4 text-sm lg:text-base text-[#767676]">
        {items.map(({ _id, title, icons }) => (
          <li key={_id} className="border-b border-b-[#F0F0F0] pb-2">
            <div className="flex items-center justify-between hover:text-primeColor transition-colors duration-300 cursor-pointer">
              {title}

              {icons && (
                <span
                  onClick={() => handleToggle(_id)}
                  className="text-[10px] lg:text-xs cursor-pointer text-gray-400 hover:text-primeColor duration-300"
                >
                  <Icon icon="heroicons-outline:plus" className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Submenu */}
            {openId === _id && (
              <ul className="ml-4 mt-2 text-[15px] text-gray-600 space-y-1">
                <li className="hover:text-primeColor hover:underline cursor-pointer transition-colors">
                  Sub category 1
                </li>
                <li className="hover:text-primeColor hover:underline cursor-pointer transition-colors">
                  Sub category 2
                </li>
                <li className="hover:text-primeColor hover:underline cursor-pointer transition-colors">
                  Sub category 3
                </li>
              </ul>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Category;
