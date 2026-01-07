import React from 'react';

interface BadgeProps {
  text: string;
}

const Badge: React.FC<BadgeProps> = ({ text }) => {
  return (
    <div
      className="bg-primeColor w-[92px] h-[35px] text-white flex justify-center items-center text-base
                     hover:bg-black duration-300 cursor-pointer font-semibold"
    >
      {text}
    </div>
  );
};
export default Badge;
