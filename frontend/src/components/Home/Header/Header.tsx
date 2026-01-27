import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { logo, logoLight } from '../../../assets/images';
import { navBarList } from '../../../constants/Constants';
import Image from '../DesignLayouts/Image';
import Flex from '../DesignLayouts/Flex';

interface navBarItem {
  _id: string | number;
  title: string;
  link: string;
}

const Header: React.FC = () => {
  const [showMenu, setShowMenu] = useState<boolean>(true);
  const location = useLocation();
  const [sideNav, setSideNav] = useState<boolean>(false);
  const [category, setCategory] = useState<boolean>(false);
  const [brand, setBrand] = useState<boolean>(false);

  useEffect(() => {
    const ResponsiveMenu = () => {
      if (window.innerWidth < 667) {
        setShowMenu(false);
      } else {
        setShowMenu(true);
      }
    };
    ResponsiveMenu();
    window.addEventListener('resize', ResponsiveMenu);
    return () => window.removeEventListener('resize', ResponsiveMenu);
  }, []);

  return (
    <div className="w-full h-20 bg-white sticky top-0 z-50 border-b-[1px] border-gray-200">
      <nav className="h-full px-4 max-w-container mx-auto relative">
        <Flex className="flex items-center justify-between h-full">
          <Link to="/">
            <div>
              <Image className="w-20 object-cover" imgSrc={logo} />
            </div>
          </Link>

          <div className="flex items-center gap-4">
            {showMenu && (
              <motion.ul
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex items-center w-auto z-50 p-0 gap-2"
              >
                {navBarList.map(({ _id, title, link }: navBarItem) => (
                  <NavLink
                    key={_id}
                    className="flex font-normal hover:font-bold w-20 h-6 justify-center items-center px-12 text-base text-[#767676] hover:underline underline-offset-[4px] decoration-[1px] hover:text-[#262626] md:border-r-[2px] border-r-gray-300 hoverEffect last:border-r-0"
                    to={link}
                    state={{ data: location.pathname.split('/')[1] }}
                  >
                    {title}
                  </NavLink>
                ))}
              </motion.ul>
            )}

            <Icon
              icon="heroicons:bars-3"
              onClick={() => setSideNav(!sideNav)}
              className="inline-block md:hidden cursor-pointer w-8 h-8 text-[#262626]"
            />

            {sideNav && (
              <div className="fixed top-0 left-0 w-full h-screen bg-black text-gray-200 bg-opacity-80 z-50">
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="w-[80%] h-full relative"
                >
                  <div className="w-full h-full bg-primeColor p-6">
                    <img
                      className="w-28 mb-6"
                      src={logoLight}
                      alt="logo light"
                    />

                    <ul className="text-gray-200 flex flex-col gap-4 mb-6">
                      {navBarList.map((item) => (
                        <li
                          className="font-normal cursor-pointer hover:font-bold text-lg text-gray-200 hover:underline underline-offset-[4px] decoration-[1px] hover:text-white hoverEffect"
                          key={item._id}
                        >
                          <NavLink
                            to={item.link}
                            state={{ data: location.pathname.split('/')[1] }}
                            onClick={() => setSideNav(false)}
                          >
                            {item.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4">
                      <h1
                        className="flex justify-between text-base cursor-pointer items-center font-titleFont mb-2 text-gray-200"
                        onClick={() => setCategory(!category)}
                      >
                        Shop By Category
                        <span className="text-lg">{category ? '-' : '+'}</span>
                      </h1>
                      {category && (
                        <motion.ul
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          className="text-[16px] flex flex-col gap-2 pl-4"
                        >
                          <li className="headerSedenavLi">New Arrivals</li>
                          <li className="headerSedenavLi">Gadgets</li>
                          <li className="headerSedenavLi">Accessories</li>
                          <li className="headerSedenavLi">Electronics</li>
                          <li className="headerSedenavLi">Others</li>
                        </motion.ul>
                      )}
                    </div>

                    <div className="mt-6">
                      <h1
                        onClick={() => setBrand(!brand)}
                        className="flex justify-between text-base cursor-pointer items-center font-titleFont mb-2 text-gray-200"
                      >
                        Shop by Brand
                        <span className="text-lg">{brand ? '-' : '+'}</span>
                      </h1>
                      {brand && (
                        <motion.ul
                          initial={{ y: 15, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ duration: 0.4 }}
                          className="text-[16px] flex flex-col gap-2 pl-4"
                        >
                          <li className="headerSedenavLi">New Arrivals</li>
                          <li className="headerSedenavLi">Gadgets</li>
                          <li className="headerSedenavLi">Accessories</li>
                          <li className="headerSedenavLi">Electronics</li>
                          <li className="headerSedenavLi">Others</li>
                        </motion.ul>
                      )}
                    </div>
                  </div>

                  <span
                    onClick={() => setSideNav(false)}
                    className="w-8 h-8 border-[1px] border-gray-300 absolute top-2 -right-10 text-gray-300 text-2xl flex justify-center items-center cursor-pointer hover:border-red-500 hover:text-red-500 duration-300"
                  >
                    <Icon icon="heroicons:x-mark" className="w-6 h-6" />
                  </span>
                </motion.div>
              </div>
            )}
          </div>
        </Flex>
      </nav>
    </div>
  );
};

export default Header;