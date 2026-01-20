import React from 'react';
import { Icon } from '@iconify/react';

interface PreProps {
  onClick?: () => void;
}

const SampleNextArrow: React.FC<PreProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-gray-500 hover:bg-opacity-100 duration-100 cursor-pointer
      flex justify-center items-center z-10 absolute top-[35%] right-2"
    >
      <Icon icon="mdi:arrow-right" className="text-white text-2xl" />
    </div>
  );
};

export default SampleNextArrow;
