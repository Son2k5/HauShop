import React, { ReactNode } from "react";

interface ListProps {
    children: ReactNode;
    className: string;
}
const List: React.FC<ListProps> = ({ children, className }) => {
    return (
        <ul className={className}>{children}</ul>
    );
}
export default List;