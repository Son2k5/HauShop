import React, { useState } from 'react';
import ReactPaginate from 'react-paginate';
import Product from '../../Home/Product/Product';
import { paginationItems } from '../../../constants/Constants';

export interface ProductType {
  _id: number;
  img: string;
  productName: string;
  price: string;
  color: string;
  badge: boolean;
  des: string;
}

interface ItemsProps {
  currentItems: ProductType[];
}

function Items({ currentItems }: ItemsProps) {
  return (
    <>
      {currentItems &&
        currentItems.map((item) => (
          <div key={item._id} className="w-full">
            <Product
              _id={item._id}
              img={item.img}
              productName={item.productName}
              price={item.price}
              color={item.color}
              badge={item.badge}
              des={item.des}
            />
          </div>
        ))}
    </>
  );
}

interface PaginationProps {
  itemsPerPage: number;
}

const items: ProductType[] = paginationItems;

const Pagination: React.FC<PaginationProps> = ({ itemsPerPage }) => {
  const [itemOffset, setItemOffset] = useState(0);
  const [itemStart, setItemStart] = useState(1);

  const endOffset = itemOffset + itemsPerPage;
  const currentItems = items.slice(itemOffset, endOffset);
  const pageCount = Math.ceil(items.length / itemsPerPage);

  const handlePageClick = (event: { selected: number }) => {
    const newOffset = (event.selected * itemsPerPage) % items.length;
    setItemOffset(newOffset);
    setItemStart(newOffset);
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 mdl:gap-4 lg:gap-10">
        <Items currentItems={currentItems} />
      </div>

      <div className="flex flex-col mdl:flex-row justify-center mdl:justify-between items-center">
        <ReactPaginate
          nextLabel="next >"
          onPageChange={handlePageClick}
          pageRangeDisplayed={3}
          marginPagesDisplayed={2}
          pageCount={pageCount}
          previousLabel="< previous"
          pageLinkClassName="w-10 h-10 border-[1px] border-lightColor hover:border-gray-500 duration-300 flex justify-center items-center gap-2"
          pageClassName="mr-6"
          containerClassName="flex text-base font-semibold font-titleFont py-10"
          activeClassName="bg-black text-white"
          nextLinkClassName="w-18 h-9 flex justify-center items-center bg-gray-200 hover:bg-gray-300 rounded p-1"
          previousLinkClassName="w-18 h-9 flex justify-center items-center bg-gray-200 hover:bg-gray-300 rounded mr-5 p-1"
        />

        <p className="text-base font-normal text-lightText">
          Products from {itemStart === 0 ? 1 : itemStart} to {endOffset} of{' '}
          {items.length}
        </p>
      </div>
    </div>
  );
};

export default Pagination;
