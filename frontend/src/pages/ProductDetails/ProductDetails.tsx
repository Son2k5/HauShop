import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';
import ProductInfo from '../../components/PageProps/ProductDetails/ProductInfo';
import ProductOnSale from '../../components/PageProps/ProductDetails/ProductOnSale';

export interface ProductType {
  id: string;
  productName: string;
  price: string;
  des: string;
  color: string;
  img: string;
  badge: boolean;
}

interface LocationState {
  item: ProductType;
}
const ProductDetails: React.FC = () => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState('');
  const [productInfo, setProductInfo] = useState<ProductType | null>(null);

  useEffect(() => {
    if (location.state?.item) {
      setProductInfo(location.state.item);
    }
    setPrevLocation(location.pathname);
  }, [location]);
  return (
    <div className="w-full mx-auto border-b-[1px] border-gray-300">
      <div className="max-w-container mx-auto px-4">
        <div className="xl:mt-10 -mt-7">
          <BreadCrumbs title="" prevLocation={prevLocation} />
        </div>
        <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 h-ful -mt-5 xl:-mt-8 pb-10 bg-gray-100 p-4">
          <div className="w-full">
            <ProductOnSale />
          </div>
          <div className="w-full xl:col-span-2">
            {productInfo && <img src={productInfo.img} alt={productInfo.img} />}
          </div>
          <div className="h-full w-full md:col-span-2 xl:col-span-3 xl:p-14 flex flex-col gap-6 justify-center">
            {productInfo && <ProductInfo productInfo={productInfo} />}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProductDetails;
