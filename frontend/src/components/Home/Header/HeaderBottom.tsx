import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  UserIcon,
  ChevronDownIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';
import Flex from '../DesignLayouts/Flex';
import { Link, useNavigate } from 'react-router-dom';
import { paginationItems } from '../../../constants/Constants';
import { RootState } from '../../../redux/store';

interface Product {
  _id: string | number;
  productName: string;
  img: string;
  price: string;
  des: string;
}

const HeaderBottom: React.FC = () => {
  const products = useSelector(
    (state: RootState) => state.orebiReducer.products
  );
  const [show, setShow] = useState<boolean>(false);
  const [showUser, setShowUser] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // Use Effect
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && ref.current.contains(e.target as Node)) {
        setShow(true);
      } else {
        setShow(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const filter = paginationItems.filter((item) =>
      item.productName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filter);
  }, [searchQuery]);

  //Handle
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="w-full bg-[#F5F5F3] relative">
      <div className="max-w-container mx-auto ">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between w-full px-2 pb-4 lg:pb-0 h-full lg:h-24 ">
          <div
            onClick={() => setShow(!show)}
            ref={ref}
            className="flex h-14 cursor-pointer items-center gap-2 text-primeColor"
          >
            <Bars3Icon className="w-5 h-5 " />
            <p className="text-[16px] font-normal">Shop by Category</p>
            {show && (
              <motion.ul
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute top-36 z-50 bg-primeColor w-auto text-[#767676] h-auto p-4 pb-6"
              >
                {[
                  'Accessories',
                  'Furniture',
                  'Electronics',
                  'Clothes',
                  'Bags',
                  'Home appliances',
                ].map((category) => (
                  <li
                    key={category}
                    className="text-gray-400 px-4 py-1 border-b border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer"
                  >
                    {category}
                  </li>
                ))}
              </motion.ul>
            )}
          </div>

          {/*  Search  */}
          <div className="relative w-full lg:w-[600px] h-[50px] text-base text-primeColor bg-white flex items-center gap-2 justify-between px-6 rounded-xl">
            <input
              type="text"
              onChange={handleSearch}
              value={searchQuery}
              placeholder="Search your products here"
              className="flex-1 h-full outline-none placeholder:text-[#C4C4C4] placeholder:text-[14px]"
            />
            <MagnifyingGlassIcon className="w-5 h-5" />
            {searchQuery && (
              <div className="w-full mx-auto bg-white top-16 absolute left-0 z-50 overflow-y-scroll shadow-2xl scrollbar-hide cursor-pointer">
                {searchQuery &&
                  filteredProducts.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => {
                        navigate(
                          `/product/${item.productName
                            .toLowerCase()
                            .split(' ')
                            .join('')}`,
                          { state: { item } }
                        );
                        setSearchQuery('');
                      }}
                      className="max-w-[600px] h-28 bg-gray-100 mb-3 flex items-center gap-3"
                    >
                      <img src={item.img} alt="itemImg" className="w-24" />
                      <div className="flex flex-col gap-1">
                        <p className="font-semibold text-lg">
                          {item.productName}
                        </p>
                        <p className="text-sm">{item.des}</p>
                        <p className="text-sm">
                          Price:{' '}
                          <span className="text-primeColor font-semibold">
                            ${item.price}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
          {/* User and Card */}
          <div className="flex gap-4  mt-3 lg:mt-0 items-center pr-6 cursor-pointer relative">
            <div onClick={() => setShowUser(!showUser)} className="flex">
              <UserIcon className="w-5 h-5 " strokeWidth={2.5} />
              <ChevronDownIcon
                className="w-5 h-5 font-bold"
                strokeWidth={2.5}
              />
            </div>
            {showUser && (
              <motion.ul
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="absolute top-6 left-0 z-50 bg-primeColor w-44 text-[#767676] h-auto p-4 pb-6"
              >
                <Link to="/signin">
                  <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                    Login
                  </li>
                </Link>
                <Link onClick={() => setShowUser(false)} to="/signup">
                  <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                    Sign Up
                  </li>
                </Link>
                <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400 hover:border-b-white hover:text-white duration-300 cursor-pointer">
                  Profile
                </li>
                <li className="text-gray-400 px-4 py-1 border-b-[1px] border-b-gray-400  hover:border-b-white hover:text-white duration-300 cursor-pointer">
                  Others
                </li>
              </motion.ul>
            )}
            <Link to="/cart">
              <div className="relative">
                <ShoppingCartIcon className="w-5 h-5" />
                <span className="absolute font-titleFont top-3 -right-2 text-xs w-4 h-4 flex items-center justify-center rounded-full bg-primeColor text-white">
                  {products.length > 0 ? products.length : 0}
                </span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeaderBottom;
