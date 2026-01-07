import React from 'react';
import { Dispatch } from '@reduxjs/toolkit';
import { addToCart } from '../../../redux/orebiSlice';
import { useDispatch } from 'react-redux';
interface ProductProps {
  id: string;
  productName: string;
  price: string;
  des: string;
  color: string;
  img: string;
  badge?: boolean;
}
interface ProductType {
  productInfo: ProductProps;
}

const ProductInfo: React.FC<ProductType> = ({ productInfo }) => {
  const dispatch = useDispatch();

  const handleAddToCart = () => {
    dispatch(
      addToCart({
        _id: productInfo.id,
        productName: productInfo.productName,
        quantity: 1,
        img: productInfo.img,
        price: productInfo.price,
        color: productInfo.color,
        badge: productInfo.badge,
      })
    );
  };
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-4xl font-semibold">{productInfo.productName}</h2>
      <p className="text-xl font-semibold">${productInfo.price}</p>
      <p className="text-base text-gray-600">{productInfo.des}</p>
      <p className="text-sm">Be the first to leave a review.</p>
      <p className=" font-medium text-lg">
        <span className="font-normal">Colors: </span> {productInfo.color}
      </p>
      <button
        onClick={handleAddToCart}
        className="w-full py-4 bg-primeColor hover:bg-black duration-300 text-white text-lg font-titleFont"
      >
        Add to Cart
      </button>
      <p className="font-normal text-sm">
        <span className="text-base font-medium"> Categories:</span> Spring
        collection, Streetwear, Women Tags: featured SKU: N/A
      </p>
    </div>
  );
};
export default ProductInfo;
