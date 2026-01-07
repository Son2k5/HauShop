import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';

const Journal: React.FC = () => {
  const location = useLocation();
  const [prevLocation, setPrevLocation] = useState<string>('');

  useEffect(() => {
    setPrevLocation(location.state?.data || '');
  }, [location]);

  return (
    <div className="max-w-container mx-auto px-4">
      <BreadCrumbs title="Journals" prevLocation={prevLocation} />
      <div className="pb-10">
        <p className="max-w-[600px] text-base text-lightText mb-4">
          <span className="text-primeColor font-semibold text-lg">Orebi</span>{' '}
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Quo
          reiciendis delectus vitae, aliquid sit iure dolorum commodi eum
          numquam voluptate!
        </p>
        <Link to="/shop">
          <button className="w-52 h-10 bg-primeColor text-white hover:bg-black duration-300">
            Continue Shopping
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Journal;
