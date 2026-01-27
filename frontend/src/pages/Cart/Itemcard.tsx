import React from 'react';
import { Icon } from '@iconify/react';
import { useDispatch } from 'react-redux';
import {
  deleteItem,
  increaseQuantity,
  decreaseQuantity,
} from '../../redux/orebiSlice';

interface Item {
  _id: string | number;
  productName: string;
  img: string;
  price: string;
  quantity: number;
}

interface ItemCardProps {
  item: Item;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const dispatch = useDispatch();
  const priceItem = parseFloat(item.price);

  return (
    <div className="w-full grid grid-cols-5 mb-4 border py-2">
      <div className="flex col-span-5 mdl:col-span-2 items-center gap-4 ml-4">
        {/* Delete Icon */}
        <Icon
          icon="heroicons-outline:x"
          onClick={() => dispatch(deleteItem(item._id))}
          className="w-6 h-6 text-primeColor hover:text-red-500 duration-300 cursor-pointer"
        />

        <img className="w-32 h-32" src={item.img} alt={item.productName} />
        <h1 className="font-titleFont font-semibold">{item.productName}</h1>
      </div>

      <div className="col-span-5 mdl:col-span-3 flex items-center justify-between py-4 mdl:py-0 px-4 mdl:px-0 gap-6 mdl:gap-0">
        <div className="flex w-1/3 items-center text-lg font-semibold">
          ${item.price}
        </div>

        {/* Quantity */}
        <div className="w-1/3 flex items-center gap-6 text-lg">
          <span
            onClick={() => dispatch(decreaseQuantity({ _id: item._id }))}
            className="w-6 h-6 bg-gray-100 text-2xl flex items-center justify-center 
              hover:bg-gray-400 cursor-pointer duration-300 border border-gray-300"
          >
            -
          </span>

          <p>{item.quantity}</p>

          <span
            onClick={() => dispatch(increaseQuantity({ _id: item._id }))}
            className="w-6 h-6 bg-gray-100 text-2xl flex items-center justify-center 
              hover:bg-gray-400 cursor-pointer duration-300 border border-gray-300"
          >
            +
          </span>
        </div>

        {/* Total */}
        <div className="w-1/3 flex items-center font-titleFont font-bold text-lg">
          <p>${item.quantity * priceItem}</p>
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
