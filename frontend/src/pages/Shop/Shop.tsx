import React, { useState } from 'react';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';
import ShopSideNav from '../../components/PageProps/shopPage/ShopSideNav';
import ProductBanner from '../../components/PageProps/shopPage/ProductBanner';
import Pagination from '../../components/PageProps/shopPage/Pagination';

const Shop: React.FC = () => {
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  const itemsPerPageFromBanner = (itemsPerPage: number) => {
    setItemsPerPage(itemsPerPage);
  };

  return (
    <div className="max-w-container mx-auto px-4">
      <BreadCrumbs title="Products" />
      <div className="w-full h-full flex pb-20 gap-10">
        <div className="w-[20%] lgl:w-[25%] hidden mdl:inline-flex h-full">
          <ShopSideNav />
        </div>
        <div className="w-full mdl:w-[80%] lgl:w-[75%] h-full flex flex-col gap-10">
          <ProductBanner itemsPerPageFromBanner={itemsPerPageFromBanner} />
          <Pagination itemsPerPage={itemsPerPage} />
        </div>
      </div>
    </div>
  );
};

export default Shop;
