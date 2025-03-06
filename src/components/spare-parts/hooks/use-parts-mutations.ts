
import { useAddPartMutation } from "./mutations/use-add-part-mutation";
import { useUpdatePartMutation } from "./mutations/use-update-part-mutation";
import { useDeletePartMutation } from "./mutations/use-delete-part-mutation";
import { getStatusFromQuantity } from "../utils/status-utils";

export const usePartsMutations = () => {
  const addPartMutation = useAddPartMutation();
  const updatePartMutation = useUpdatePartMutation();
  const deletePartMutation = useDeletePartMutation();

  return {
    addPartMutation,
    updatePartMutation,
    deletePartMutation,
    getStatusFromQuantity
  };
};
