import { useToast } from "@/hooks/use-toast";

export class ApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

export const handleApiError = (error: unknown): ApiError => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  // Handle Supabase error objects
  if (error && typeof error === "object" && "message" in error) {
    const errorObj = error as {
      message: string;
      code?: string;
      status?: number;
    };
    return new ApiError(errorObj.message, errorObj.status, errorObj.code);
  }

  // Handle string errors
  if (typeof error === "string") {
    return new ApiError(error);
  }

  return new ApiError("An unknown error occurred");
};

export const useApiErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error: unknown, customMessage?: string) => {
    const apiError = handleApiError(error);

    console.error("API Error:", apiError);

    toast({
      title: "Error",
      description: customMessage || apiError.message,
      variant: "destructive",
    });

    return apiError;
  };

  return { handleError };
};
