import React from 'react';
import { ArrowBack } from '@mui/icons-material';

interface PrevProps {
  onClick?: () => void;
}

const SamplePrevArrow: React.FC<PrevProps> = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="w-14 h-14 rounded-full bg-gray-500 hover:bg-opacity-100 duration-100 cursor-pointer
    flex justify-center items-center z-10 absolute top-[35%] left-2"
    >
      <ArrowBack className="" />
    </div>
  );
};

export default SamplePrevArrow;
