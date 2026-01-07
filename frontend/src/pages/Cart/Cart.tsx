import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';
import { resetCart } from '../../redux/orebiSlice';
import { emptyCart } from '../../assets/images';
import ItemCard from './Itemcard';
import { RootState } from '../../redux/store';

export interface ProductProps {
  _id: string;
  price: string;
  quantity: number;
}

const Cart: React.FC = () => {
  const dispatch = useDispatch();
  const products = useSelector(
    (state: RootState) => state.orebiReducer.products
  );
  const [totalAmt, setTotalAmt] = useState<number>(0);
  const [shippingCharge, setShippingChart] = useState<number>(0);

  useEffect(() => {
    const price = products.reduce((acc, item) => {
      const priceItem = parseFloat(item.price);
      return acc + priceItem * item.quantity;
    }, 0);
    setTotalAmt(price);
  }, [products]);

  useEffect(() => {
    if (totalAmt <= 200) {
      setShippingChart(30);
    } else if (totalAmt <= 400) {
      setShippingChart(25);
    } else if (totalAmt > 401) {
      setShippingChart(20);
    }
  }, [totalAmt]);
  return (
    <div className="max-w-container mx-auto px-4">
      <BreadCrumbs title="Cart" />
      {products.length > 0 ? (
        <div className="pb-20">
          <div className=" w-full h-20 bg-[#F5F7F7] text-primeColor hidden lgl:grid grid-cols-5 justify-center items-center place-content-center px-6 text-lg font-titleFont font-semibold">
            <h2 className="col-span-2">Product</h2>
            <h2>Price</h2>
            <h2>Quantity</h2>
            <h2>Sub Total</h2>
          </div>
          <div className="mt-5">
            {products.map((item) => (
              <div key={item._id}>
                <ItemCard item={item} />
              </div>
            ))}
          </div>
          <button
            onClick={() => dispatch(resetCart())}
            className="py-2 px-10 bg-red-500 text-white font-semibold uppercase hover:bg-red-700  duration-300"
          >
            Reset Cart
          </button>
          <div className="flex flex-col mdl:flex-row justify-between border  mt-4 py-4 px-4 items-center gap-2 mdl:gap-0">
            <div className="flex items-center gap-4">
              <input
                className="w-44 mdl:w-52 h-8 border px-4 text-primeColor text-sm outline-none border-gray-300"
                type="text"
                placeholder="Coupon Number"
              />
              <p className="text-lg font-semibold ">Apply Coupon</p>
            </div>
            <p className="text-lg font-semibold">Update Cart</p>
          </div>
          <div className="max-w-7xl gap-4 flex justify-end mt-4">
            <div className="w-96 flex flex-col gap-4">
              <h1 className="text-2xl font-semibold text-right">Cart Totals</h1>
              <div>
                <p className="flex items-center justify-between border-[1px] border-gray-400 border-b-0 py-1.5 text-lg px-4 font-medium">
                  SubTotal
                  <span className="font-semibold tracking-wide font-titleFont">
                    ${totalAmt}
                  </span>
                </p>
                <p className="flex items-center justify-between border-[1px] border-gray-400 border-b-0 py-1.5 text-lg px-4 font-medium">
                  Shipping Charge
                  <span className="font-semibold tracking-wide font-titleFont">
                    ${shippingCharge}
                  </span>
                </p>
                <p className="flex items-center justify-between border-[1px] border-gray-400 py-1.5 text-lg px-4 font-medium">
                  Total
                  <span className="font-semibold tracking-wide font-titleFont">
                    ${totalAmt + shippingCharge}
                  </span>
                </p>
              </div>
              <div className="flex justify-end">
                <Link to="/payment">
                  <button className="w-52 h-10 bg-primeColor text-white hover:bg-black duration-300">
                    Proceed to Checkout
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col mdl:flex-row justify-center items-center gap-4 pb-20"
        >
          <div>
            <img
              className="w-80 rounded-lg p-4 mx-auto"
              src={emptyCart}
              alt="emptyCart"
            />
          </div>
          <div className="max-w-[500px] p-4 py-8 bg-white flex gap-4 flex-col items-center rounded-md shadow-lg">
            <h1 className="font-titleFont text-xl font-bold uppercase">
              Your Cart feels lonely.
            </h1>
            <p className="text-sm text-center px-10 -mt-2">
              Your Shopping cart lives to serve. Give it purpose - fill it with
              books, electronics, videos, etc. and make it happy.
            </p>
            <Link to="/shop">
              <button className="bg-primeColor rounded-md cursor-pointer hover:bg-black active:bg-gray-900 px-8 py-2 font-titleFont font-semibold text-lg text-gray-200 hover:text-white duration-300">
                Continue Shopping
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </div>
  );
};
export default Cart;
