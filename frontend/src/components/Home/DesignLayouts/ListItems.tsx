import React, { ReactNode } from 'react';

interface ListItemProps {
  children: ReactNode;
  className: string;
}
const ListItems: React.FC<ListItemProps> = ({ children, className }) => {
  return <li className={className}>{children}</li>;
};
export default ListItems;
