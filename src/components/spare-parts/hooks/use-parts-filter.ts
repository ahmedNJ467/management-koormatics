
import { useState, useMemo } from "react";
import { SparePart } from "../types";

export const usePartsFilter = (spareParts: SparePart[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredParts = useMemo(() => {
    return spareParts.filter((part) =>
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.part_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [spareParts, searchQuery]);

  const inStockParts = useMemo(() => 
    filteredParts.filter((p) => p.status === "in_stock"),
    [filteredParts]
  );
  
  const lowStockParts = useMemo(() => 
    filteredParts.filter((p) => p.status === "low_stock"),
    [filteredParts]
  );
  
  const outOfStockParts = useMemo(() => 
    filteredParts.filter((p) => p.status === "out_of_stock"),
    [filteredParts]
  );

  return {
    searchQuery,
    setSearchQuery,
    filteredParts,
    inStockParts,
    lowStockParts,
    outOfStockParts
  };
};
