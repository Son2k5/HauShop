import React from 'react';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import DoubleArrowOutlinedIcon from '@mui/icons-material/DoubleArrowOutlined';
import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import FavoriteOutlinedIcon from '@mui/icons-material/FavoriteOutlined';
import { useNavigate } from 'react-router-dom';
import { addToCart } from '../../../redux/orebiSlice';
import Badge from './Badge';
import Image from '../DesignLayouts/Image';
import { useDispatch } from 'react-redux';

interface ProductProps {
  _id: string | number;
  productName: string;
  price: string;
  img: string;
  badge?: boolean;
  color?: string;
  des?: string;
}

const Product: React.FC<ProductProps> = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const RootId = props.productName.toLowerCase().split(' ').join('-');

  const handleProductDetails = () => {
    navigate(`/product/${RootId}`, {
      state: {
        item: props,
      },
    });
  };

  return (
    <div className="group relative border border-gray-200 rounded-md shadow-sm w-full h-full">
      {/* Image container - responsive height */}
      <div className="relative overflow-hidden aspect-square">
        <div className="w-full h-full">
          <Image className="w-full h-full object-cover" imgSrc={props.img} />
        </div>
        <div className="absolute top-2 left-2">
          {props.badge && <Badge text="New" />}
        </div>

        {/* Hover overlay - responsive */}
        <div className="w-full h-full absolute bg-white bg-opacity-95 -bottom-full group-hover:bottom-0 duration-500 transition-all ease-in-out">
          <ul className="w-full h-full flex flex-col items-center justify-center gap-1 sm:gap-2 font-titleFont px-2 text-xs sm:text-sm">
            <li className="text-[#767676] hover:text-primeColor font-normal border-b border-gray-200 hover:border-b-primeColor flex justify-center items-center gap-1 sm:gap-2 hover:cursor-pointer pb-1 w-full transition-colors duration-200">
              <span className="hidden sm:inline">Compare</span>
              <CompareArrowsOutlinedIcon className="text-base sm:text-lg" />
            </li>

            <li
              onClick={() =>
                dispatch(
                  addToCart({
                    _id: props._id,
                    productName: props.productName,
                    quantity: 1,
                    img: props.img,
                    badge: props.badge,
                    price: props.price,
                    color: props.color,
                  })
                )
              }
              className="text-[#767676] hover:text-primeColor font-normal border-b border-gray-200 hover:border-b-primeColor flex justify-center items-center gap-1 sm:gap-2 hover:cursor-pointer pb-1 w-full transition-colors duration-200"
            >
              <span className="hidden sm:inline">Add to Cart</span>
              <ShoppingCartOutlinedIcon className="text-base sm:text-lg" />
            </li>

            <li
              className="text-[#767676] hover:text-primeColor font-normal border-b border-gray-200 hover:border-b-primeColor flex justify-center items-center gap-1 sm:gap-2 hover:cursor-pointer pb-1 w-full transition-colors duration-200"
              onClick={handleProductDetails}
            >
              <span className="hidden sm:inline">View Details</span>
              <DoubleArrowOutlinedIcon className="text-base sm:text-lg" />
            </li>

            <li className="text-[#767676] hover:text-primeColor font-normal border-b border-gray-200 hover:border-b-primeColor flex justify-center items-center gap-1 sm:gap-2 hover:cursor-pointer pb-1 w-full transition-colors duration-200">
              <span className="hidden sm:inline">Add to Wish List</span>
              <FavoriteOutlinedIcon className="text-base sm:text-lg" />
            </li>
          </ul>
        </div>
      </div>

      {/* Product info - responsive padding and text */}
      <div className="p-2 sm:p-4 flex flex-col gap-1 border border-gray-200 border-t-0">
        <div className="flex items-start justify-between font-titleFont gap-2">
          <h2 className="text-sm sm:text-base lg:text-lg text-primeColor font-bold line-clamp-2 flex-1">
            {props.productName}
          </h2>
          <p className="text-[#767676] text-sm sm:text-base font-semibold whitespace-nowrap">
            ${props.price}
          </p>
        </div>
        {props.color && (
          <div>
            <p className="text-[#767676] text-xs sm:text-sm">{props.color}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Product;
