
import { supabase } from "@/integrations/supabase/client";
import { Contract } from "@/pages/Contracts";

export const fetchContracts = async (): Promise<Contract[]> => {
  const { data, error } = await supabase
    .from("contracts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching contracts:", error);
    throw error;
  }

  return data as Contract[];
};

export const addContract = async (
  newContract: Partial<Contract>,
  contractFile: File | null
): Promise<Contract> => {
  // Ensure all required fields are present
  if (
    !newContract.name ||
    !newContract.client_name ||
    !newContract.status ||
    !newContract.start_date ||
    !newContract.end_date
  ) {
    throw new Error("Missing required fields");
  }

  // Cast to proper type to ensure type safety
  const contractStatus = newContract.status as "active" | "pending" | "expired";

  const contractToInsert = {
    name: newContract.name,
    client_name: newContract.client_name,
    status: contractStatus,
    start_date: newContract.start_date,
    end_date: newContract.end_date,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("contracts")
    .insert(contractToInsert)
    .select()
    .single();

  if (error) {
    console.error("Error inserting contract:", error);
    throw error;
  }

  // Upload contract file if provided
  if (contractFile && data.id) {
    try {
      const fileExt = contractFile.name.split(".").pop();
      const fileName = `${data.id}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      console.log("Uploading file:", filePath);
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("documents")
        .upload(filePath, contractFile);

      if (uploadError) {
        console.error("File upload error:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded successfully:", uploadData);

      // Update contract with file path
      const { error: updateError } = await supabase
        .from("contracts")
        .update({ contract_file: filePath })
        .eq("id", data.id);

      if (updateError) {
        console.error("Error updating contract with file path:", updateError);
        throw updateError;
      }
    } catch (uploadError) {
      console.error("Exception during file upload:", uploadError);
      // We don't rethrow here to avoid losing the contract data
      // if only the file upload fails
    }
  }

  return data as Contract;
};

export const updateContract = async (
  contractId: string,
  updatedContract: Partial<Contract>,
  contractFile: File | null
): Promise<Contract> => {
  if (!contractId) throw new Error("No contract selected");

  console.log("Updating contract:", contractId, updatedContract);

  // Cast to proper type to ensure type safety
  if (updatedContract.status) {
    updatedContract.status = updatedContract.status as "active" | "pending" | "expired";
  }

  const { data, error } = await supabase
    .from("contracts")
    .update(updatedContract)
    .eq("id", contractId)
    .select()
    .single();

  if (error) {
    console.error("Error updating contract data:", error);
    throw error;
  }

  // Upload new contract file if provided
  if (contractFile) {
    try {
      const fileExt = contractFile.name.split(".").pop();
      const fileName = `${contractId}.${fileExt}`;
      const filePath = `contracts/${fileName}`;

      console.log("Uploading new file for contract:", filePath);
      
      // First check if file exists to determine if we need upsert
      const { data: existingFile } = await supabase.storage
        .from("documents")
        .list(`contracts`, {
          search: fileName
        });
      
      const fileExists = existingFile && existingFile.length > 0;
      console.log("File exists check:", fileExists, existingFile);

      // Upload the new file (with upsert if file exists)
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("documents")
        .upload(filePath, contractFile, { upsert: fileExists });

      if (uploadError) {
        console.error("File upload error during update:", uploadError);
        throw uploadError;
      }

      console.log("File uploaded successfully during update:", uploadData);

      // Update contract with file path if needed
      if (data.contract_file !== filePath) {
        const { error: updateError } = await supabase
          .from("contracts")
          .update({ contract_file: filePath })
          .eq("id", contractId);

        if (updateError) {
          console.error("Error updating contract with new file path:", updateError);
          throw updateError;
        }
      }
    } catch (uploadError) {
      console.error("Exception during file update:", uploadError);
      throw uploadError;
    }
  }

  return data as Contract;
};

export const deleteContract = async (id: string): Promise<string> => {
  // First get the contract to check for file
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select("contract_file")
    .eq("id", id)
    .single();

  if (fetchError) {
    console.error("Error fetching contract for deletion:", fetchError);
    throw fetchError;
  }

  // Delete the contract
  const { error } = await supabase.from("contracts").delete().eq("id", id);

  if (error) {
    console.error("Error deleting contract:", error);
    throw error;
  }

  // Also delete the file from storage if it exists
  if (contract?.contract_file) {
    try {
      const { error: deleteFileError } = await supabase.storage
        .from("documents")
        .remove([contract.contract_file]);

      if (deleteFileError) {
        console.error("Error deleting file:", deleteFileError);
        // Don't throw here to allow contract deletion to succeed
      }
    } catch (deleteError) {
      console.error("Exception during file deletion:", deleteError);
      // Don't throw here to allow contract deletion to succeed
    }
  }

  return id;
};

export const downloadContractFile = async (
  contract: Contract
): Promise<Blob> => {
  if (!contract.contract_file) {
    throw new Error("No file available");
  }

  console.log("Downloading file:", contract.contract_file);
  const { data, error } = await supabase.storage
    .from("documents")
    .download(contract.contract_file);

  if (error) {
    console.error("Error downloading file:", error);
    throw error;
  }

  return data;
};
