import React, { useState } from 'react';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';
import SpecialOffers from '../../components/Home/SpecialOffer/SpecialOffer';

const Offer: React.FC = () => {
  const [prevLocation] = useState('');
  return (
    <div className="mx-w-container mx-auto">
      <BreadCrumbs prevLocation={prevLocation} title="Offer" />
      <div className="pb-10">
        <SpecialOffers />
      </div>
    </div>
  );
};
export default Offer;
