import React from 'react';
import { Link } from 'react-router-dom';
import { productOfTheYear } from '../../../assets/images';
import ShopNow from '../DesignLayouts/Buttons/ShopNow';
import Image from '../DesignLayouts/Image';

const YearProduct: React.FC = () => {
  return (
    <Link to="/shop" className="block">
      <div className="w-full h-64 sm:h-80 lg:h-96 mb-10 sm:mb-20 bg-[#f3f3f3] md:bg-transparent relative font-titleFont overflow-hidden rounded-lg md:rounded-none shadow-md md:shadow-none">
        <Image
          className="w-full h-full object-cover hidden md:block"
          imgSrc={productOfTheYear}
        />

        <div className="absolute inset-0 md:inset-auto md:top-0 md:right-0 md:w-2/3 lg:w-1/2 xl:w-2/5 md:h-full flex flex-col justify-center items-start p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="md:hidden absolute inset-0 bg-black bg-opacity-20 rounded-lg"></div>

          <div className="relative z-10 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-primeColor mb-3 sm:mb-4 md:mb-6 leading-tight">
              Product of the year
            </h1>

            <p className="text-sm sm:text-base md:text-lg font-normal text-primeColor mb-4 sm:mb-6 md:mb-8 leading-relaxed max-w-full md:max-w-[500px] lg:max-w-[600px]">
              Lorem ipsum, dolor sit amet consectetur adipisicing elit. Tempora
              harum modi aperiam quos deserunt expedita nam architecto
              voluptatibus exercitationem temporibus cupiditate fugit ab iste
              natus eius non incidunt, libero ad?
            </p>

            <div className="transform hover:scale-105 transition-transform duration-200">
              <ShopNow />
            </div>
          </div>
        </div>

        <div className="absolute inset-0 md:hidden">
          <Image
            className="w-full h-full object-cover opacity-30"
            imgSrc={productOfTheYear}
          />
        </div>
      </div>
    </Link>
  );
};

export default YearProduct;
