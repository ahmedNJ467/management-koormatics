
import { useState } from "react";

export const usePartsSorting = () => {
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'}>({
    column: "updated_at",
    direction: "desc"
  });

  const handleSort = (column: string) => {
    setSortConfig(current => ({
      column,
      direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return {
    sortConfig,
    handleSort
  };
};
