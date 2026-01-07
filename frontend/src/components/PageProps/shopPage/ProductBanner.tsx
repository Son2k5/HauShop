import React, { useState } from 'react';
import GridViewIcon from '@mui/icons-material/GridView';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface BannerProps {
  itemsPerPageFromBanner: (value: number) => void;
}
const ProductBanner: React.FC<BannerProps> = ({ itemsPerPageFromBanner }) => {
  const [gridViewActive, setGridViewActive] = useState(true);
  const handleGridClick = () => {
    setGridViewActive(true);
  };
  const handleListClick = () => {
    setGridViewActive(false);
  };

  return (
    <div className="flex flex-col w-full md:flex-row md:items-center justify-between">
      <div className="flex items-center gap-4">
        <span
          onClick={handleGridClick}
          className={`w-8 h-8 text-lg flex items-center justify-center cursor-pointer
                ${gridViewActive ? 'bg-primeColor text-white' : 'border-[1px] border-gray-300 text-[#737373]'}`}
        >
          <GridViewIcon />
        </span>
        <span
          onClick={handleListClick}
          className={`w-8 h-8 text-lg flex items-center justify-center cursor-pointer
                ${!gridViewActive ? 'bg-primeColor text-white' : 'border-[1px] border-gray-300 text-[#737373]'}`}
        >
          <FormatListBulletedIcon />
        </span>
      </div>
      <div className="flex items-center gap-2 md:gap-6 mt-4 md:mt-0">
        <div className="flex items-center gap-2 text-base text-[#767676] relative">
          <label className="block">Sort By:</label>
          <select
            id="sort"
            className="w-32 md:w-52 border-[1px] border-gray-200 py-1 px-4 cursor-pointer text-primeColor text-base block appearance-none focus:outline-none focus-visible:border-primeColor"
          >
            <option value="Best Sellers">Best Sellers</option>
            <option value="New Arrival">New Arrival</option>
            <option value="Featured">Featured</option>
            <option value="Final Offer">Final Offer</option>
          </select>
          <span className="absolute text-sm right-2 md:right-4 top-1">
            <ArrowDropDownIcon />
          </span>
        </div>
        <div className="flex items-center gap-2 text-[#767676] relative">
          <label className="block">Show:</label>
          <select
            onChange={(e) => itemsPerPageFromBanner(+e.target.value)}
            id="show"
            className="w-16 md:w-20 border-[1px] border-gray-200 py-1 px-4 cursor-pointer text-primeColor text-base block appearance-none focus:outline-none focus-visible:border-primeColor"
          >
            <option value="12">12</option>
            <option value="24">24</option>
            <option value="36">36</option>
            <option value="48">48</option>
          </select>
          <span className="absolute text-sm right-3 top-1">
            <ArrowDropDownIcon />
          </span>
        </div>
      </div>
    </div>
  );
};
export default ProductBanner;
