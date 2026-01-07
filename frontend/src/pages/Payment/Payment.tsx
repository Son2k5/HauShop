import React from 'react';
import BreadCrumbs from '../../components/PageProps/Breadcrumbs/Breadcrumbs';
import { Link } from 'react-router-dom';

const Payment: React.FC = () => {
  return (
    <div className="max-w-container mx-auto px-4">
      <BreadCrumbs title="Payment gateway" />
      <div className="pb-10">
        <p> Payment gateway only applicable for production build.</p>
        <Link to="/">
          <button className="w-52 h-10 bg-primeColor text-white text-lg mt-4 hover:bg-black duration-300">
            Explore More
          </button>
        </Link>
      </div>
    </div>
  );
};
export default Payment;
