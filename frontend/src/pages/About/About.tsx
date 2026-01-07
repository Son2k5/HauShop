import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';

const About: React.FC = () => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState<string>('');

  useEffect(() => {
    setPrevLocation(location.state.data);
  }, [location]);
  return (
    <div className="max-w-container mx-auto px-4">
      <BreadCrumbs title="About" prevLocation={prevLocation} />
      <div className="pb-10">
        <h1 className="max-w-[600px] text-base text-lightText mb-2">
          <span className="text-primeColor font-semibold text-lg">Orebi</span>{' '}
          is one of the world's leading ecommerce brands and is internationally
          recognized for celebrating the essence of classic Worldwide cool
          looking style.
        </h1>
        <Link to="/shop">
          <button className="w-52 h-10 bg-primeColor text-white hover:bg-black duration-300 mt-3">
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
};
export default About;
