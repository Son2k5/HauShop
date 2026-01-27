import React from 'react';
import { Icon } from '@iconify/react';

const BannerBottom: React.FC = () => {
  return (
    <div className="w-full bg-white border-b border-gray-200 py-4 px-4">
      <div className="max-w-container mx-auto h-20 flex flex-col md:flex-row justify-between items-center">

        {/* Warranty */}
        <div className="flex items-center gap-2 w-72 shadow-sm hover:shadow-md duration-300">
          <span className="font-bold font-titleFont w-6 text-center">2</span>
          <p className="text-lightText text-base">Two years warranty</p>
        </div>

        {/* Free shipping */}
        <div className="flex items-center gap-2 w-72 shadow-sm hover:shadow-md duration-300">
          <Icon icon="heroicons-outline:rocket-launch" className="w-6 h-6 text-gray-700" />
          <p className="text-lightText text-base">Free shipping</p>
        </div>

        {/* Return policy */}
        <div className="flex items-center gap-2 w-72 shadow-sm hover:shadow-md duration-300">
          <Icon icon="heroicons-outline:currency-rupee" className="w-6 h-6 text-gray-700" />
          <p className="text-lightText text-base">Return policy in 30 days</p>
        </div>

      </div>
    </div>
  );
};

export default BannerBottom;
