import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLocation } from 'react-router-dom';

interface BreadProps {
  prevLocation?: string;
  title: string;
}

const BreadCrumbs: React.FC<BreadProps> = ({ prevLocation = '', title }) => {
  const location = useLocation();
  const [locationPath, setLocationPath] = useState('');

  useEffect(() => {
    setLocationPath(location.pathname.split('/')[1]);
  }, [location]);

  return (
    <div className="w-full py-10 xl:py-10 flex flex-col gap-3">
      <p className="text-5xl text-primeColor font-titleFont font-bold">
        {title}
      </p>

      <p className="text-sm font-normal text-lightText capitalize flex items-center">
        <span>{prevLocation === '' ? 'Home' : prevLocation}</span>

        <span className="px-1 flex items-center">
          <Icon icon="mdi:chevron-right" className="text-lg" />
        </span>

        <span className="capitalize font-semibold text-primeColor">
          {locationPath}
        </span>
      </p>
    </div>
  );
};

export default BreadCrumbs;
