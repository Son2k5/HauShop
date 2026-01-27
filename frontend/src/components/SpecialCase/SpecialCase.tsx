import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';

const SpecialCase: React.FC = () => {
  const products = useSelector(
    (state: RootState) => state.orebiReducer.products
  );

  const totalQuantity = products.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="fixed top-52 right-2 z-20 hidden md:flex flex-col gap-2">
      
      {/* Profile */}
      <Link to="/signin">
        <div className="bg-white w-16 h-[70px] rounded-md flex flex-col gap-1 text-[#33475b] justify-center items-center shadow-lg overflow-x-hidden group cursor-pointer">
          <div className="flex justify-center items-center">
            <Icon
              icon="heroicons-outline:user-circle"
              className="w-6 h-6 -translate-x-12 group-hover:translate-x-3 transition-transform duration-200"
            />
            <Icon
              icon="heroicons-outline:user-circle"
              className="w-6 h-6 -translate-x-3 group-hover:translate-x-12 transition-transform duration-200"
            />
          </div>
          <p className="text-xs font-semibold font-titleFont">Profile</p>
        </div>
      </Link>

      {/* Cart */}
      <Link to="/cart">
        <div className="bg-white w-16 h-[70px] rounded-md flex flex-col gap-1 text-[#33475b] justify-center items-center shadow-lg overflow-x-hidden group cursor-pointer relative">
          <div className="flex justify-center items-center">
            <Icon
              icon="heroicons-outline:shopping-cart"
              className="w-6 h-6 -translate-x-12 group-hover:translate-x-3 transition-transform duration-200"
            />
            <Icon
              icon="heroicons-outline:shopping-cart"
              className="w-6 h-6 -translate-x-3 group-hover:translate-x-12 transition-transform duration-200"
            />
          </div>
          <p className="text-xs font-semibold font-titleFont">Shop Now</p>

          {totalQuantity > 0 && (
            <p className="absolute top-1 right-2 bg-primeColor text-white w-4 h-4 rounded-full flex items-center justify-center font-semibold">
              {totalQuantity}
            </p>
          )}
        </div>
      </Link>

    </div>
  );
};

export default SpecialCase;
