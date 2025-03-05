
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

  const contractToInsert = {
    name: newContract.name,
    client_name: newContract.client_name,
    status: newContract.status,
    start_date: newContract.start_date,
    end_date: newContract.end_date,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("contracts")
    .insert(contractToInsert)
    .select()
    .single();

  if (error) throw error;

  // Upload contract file if provided
  if (contractFile && data.id) {
    const fileExt = contractFile.name.split(".").pop();
    const fileName = `${data.id}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, contractFile);

    if (uploadError) throw uploadError;

    // Update contract with file path
    const { error: updateError } = await supabase
      .from("contracts")
      .update({ contract_file: filePath })
      .eq("id", data.id);

    if (updateError) throw updateError;
  }

  return data;
};

export const updateContract = async (
  contractId: string,
  updatedContract: Partial<Contract>,
  contractFile: File | null
): Promise<Contract> => {
  if (!contractId) throw new Error("No contract selected");

  const { data, error } = await supabase
    .from("contracts")
    .update(updatedContract)
    .eq("id", contractId)
    .select()
    .single();

  if (error) throw error;

  // Upload new contract file if provided
  if (contractFile) {
    const fileExt = contractFile.name.split(".").pop();
    const fileName = `${contractId}.${fileExt}`;
    const filePath = `contracts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, contractFile, { upsert: true });

    if (uploadError) throw uploadError;

    // Update contract with file path
    const { error: updateError } = await supabase
      .from("contracts")
      .update({ contract_file: filePath })
      .eq("id", contractId);

    if (updateError) throw updateError;
  }

  return data;
};

export const deleteContract = async (id: string): Promise<string> => {
  // First get the contract to check for file
  const { data: contract, error: fetchError } = await supabase
    .from("contracts")
    .select("contract_file")
    .eq("id", id)
    .single();

  if (fetchError) throw fetchError;

  // Delete the contract
  const { error } = await supabase.from("contracts").delete().eq("id", id);

  if (error) throw error;

  // Also delete the file from storage if it exists
  if (contract?.contract_file) {
    const { error: deleteFileError } = await supabase.storage
      .from("documents")
      .remove([contract.contract_file]);

    if (deleteFileError) console.error("Error deleting file:", deleteFileError);
  }

  return id;
};

export const downloadContractFile = async (
  contract: Contract
): Promise<Blob> => {
  if (!contract.contract_file) {
    throw new Error("No file available");
  }

  const { data, error } = await supabase.storage
    .from("documents")
    .download(contract.contract_file);

  if (error) throw error;

  return data;
};
