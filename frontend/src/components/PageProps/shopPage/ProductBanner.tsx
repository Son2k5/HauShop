import React, { useState } from 'react';
import { Icon } from '@iconify/react';

interface BannerProps {
  itemsPerPageFromBanner: (value: number) => void;
}

const ProductBanner: React.FC<BannerProps> = ({ itemsPerPageFromBanner }) => {
  const [gridViewActive, setGridViewActive] = useState(true);

  return (
    <div className="flex flex-col w-full md:flex-row md:items-center justify-between">
      {/* Grid / List */}
      <div className="flex items-center gap-4">
        <span
          onClick={() => setGridViewActive(true)}
          className={`w-8 h-8 flex items-center justify-center cursor-pointer
          ${gridViewActive
            ? 'bg-primeColor text-white'
            : 'border border-gray-300 text-[#737373]'}`}
        >
          <Icon icon="mdi:view-grid-outline" className="text-xl" />
        </span>

        <span
          onClick={() => setGridViewActive(false)}
          className={`w-8 h-8 flex items-center justify-center cursor-pointer
          ${!gridViewActive
            ? 'bg-primeColor text-white'
            : 'border border-gray-300 text-[#737373]'}`}
        >
          <Icon icon="mdi:format-list-bulleted" className="text-xl" />
        </span>
      </div>

      {/* Sort & Show */}
      <div className="flex items-center gap-2 md:gap-6 mt-4 md:mt-0">
        {/* Sort */}
        <div className="flex items-center gap-2 text-base text-[#767676] relative">
          <label>Sort By:</label>
          <select
            className="w-32 md:w-52 border border-gray-200 py-1 px-4
            cursor-pointer text-primeColor appearance-none focus:outline-none"
          >
            <option>Best Sellers</option>
            <option>New Arrival</option>
            <option>Featured</option>
            <option>Final Offer</option>
          </select>
          <span className="absolute right-2 md:right-4 top-1">
            <Icon icon="mdi:chevron-down" className="text-xl" />
          </span>
        </div>

        {/* Show */}
        <div className="flex items-center gap-2 text-[#767676] relative">
          <label>Show:</label>
          <select
            onChange={(e) => itemsPerPageFromBanner(+e.target.value)}
            className="w-16 md:w-20 border border-gray-200 py-1 px-4
            cursor-pointer text-primeColor appearance-none focus:outline-none"
          >
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="36">36</option>
            <option value="48">48</option>
          </select>
          <span className="absolute right-3 top-1">
            <Icon icon="mdi:chevron-down" className="text-xl" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductBanner;
