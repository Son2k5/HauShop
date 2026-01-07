import React from 'react';
import { ArrowForward } from '@mui/icons-material';

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
      <span className="">
        <ArrowForward className="" />
      </span>
    </div>
  );
};
export default SampleNextArrow;
