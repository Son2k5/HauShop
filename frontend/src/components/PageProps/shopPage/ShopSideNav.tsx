import React from 'react';
import Brand from './ShopBy/Brand';
import Category from './ShopBy/Category';
import Color from './ShopBy/Color';
import Price from './ShopBy/Price';

const ShopSideNav: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-6">
      <Category />
      <Color />
      <Brand />
      <Price />
    </div>
  );
};
export default ShopSideNav;
