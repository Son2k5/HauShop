import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NavTitle from './NavTitle';

const Color: React.FC = () => {
  const [showColors, setShowColors] = useState(true);

  const colors = [
    { _id: 9001, title: 'Green', base: '#22c55e' },
    { _id: 9002, title: 'Gray', base: '#a3a3a3' },
    { _id: 9003, title: 'Red', base: '#dc2626' },
    { _id: 9004, title: 'Yellow', base: '#f59e0b' },
    { _id: 9005, title: 'Blue', base: '#3b82f6' },
  ];

  return (
    <div>
      <div
        onClick={() => setShowColors(!showColors)}
        className="cursor-pointer"
      >
        <NavTitle title="Shop by Color" icons={true} />
      </div>

      <AnimatePresence>
        {showColors && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <ul className="flex flex-col gap-4 text-[15px] lg:text-[17px] text-[#555]">
              {colors.map((item) => (
                <li
                  key={item._id}
                  className="border-b-[1px] border-b-[#F0F0F0] pb-2 flex items-center gap-3 hover:text-primeColor transition-colors duration-300 cursor-pointer"
                >
                  <motion.span
                    style={{ background: item.base }}
                    className="w-3 h-3 rounded-full"
                    whileHover={{ scale: 1.3 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  ></motion.span>
                  {item.title}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Color;
