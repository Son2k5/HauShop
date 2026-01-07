import React, { ReactNode } from "react";

interface FlexProps {
    children: ReactNode;
    className: string;
}
const Flex: React.FC<FlexProps> = ({ children, className }) => {
    return (
        <div className={className}>{children}</div>
    )
}
export default Flex;