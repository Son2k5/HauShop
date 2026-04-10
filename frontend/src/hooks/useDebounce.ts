import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Hủy timer nếu value thay đổi trước khi delay kết thúc
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}