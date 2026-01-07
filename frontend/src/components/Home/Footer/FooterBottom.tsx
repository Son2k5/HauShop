import React from 'react';
import CopyrightIcon from '@mui/icons-material/Copyright';
const FooterBootom: React.FC = () => {
  return (
    <div className="w-full bg-[#F5F5F3] group">
      <div className="max-w-container mx-auto border-t-[1px] pt-10 pb-20">
        <p className="text-titleFont font-normal text-center flex md:items-center justify-center text-light duration-200 text-sm">
          <span className="text-[18px] mr-[1px] mt-[2px] md:mt-0 text-center hidden md:inline-flex">
            <CopyrightIcon className="" />
          </span>
          Copyright 2025 | Orebi Shopping | All Right Reserved
        </p>
      </div>
    </div>
  );
};
export default FooterBootom;
