import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateUserResult {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface DeleteUserResult {
  success: boolean;
  message: string;
  details?: {
    deleted_email: string;
    deleted_user_id: string;
    counts: Record<string, number>;
  };
}

export function useTestUserManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastDeleteResult, setLastDeleteResult] = useState<DeleteUserResult | null>(null);

  const createTestUser = async (email: string, password: string): Promise<CreateUserResult | null> => {
    setIsCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("manage-test-user", {
        body: { action: "create", email, password },
      });

      if (error) {
        console.error("Error creating test user:", error);
        toast.error(error.message || "Erro ao criar usuário de teste");
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      toast.success(data.message);
      return data as CreateUserResult;
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado ao criar usuário de teste");
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTestUser = async (email: string): Promise<DeleteUserResult | null> => {
    setIsDeleting(true);
    setLastDeleteResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("manage-test-user", {
        body: { action: "delete", email },
      });

      if (error) {
        console.error("Error deleting test user:", error);
        toast.error(error.message || "Erro ao deletar usuário de teste");
        return null;
      }

      if (data.error) {
        toast.error(data.error);
        return null;
      }

      toast.success(data.message);
      setLastDeleteResult(data as DeleteUserResult);
      return data as DeleteUserResult;
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Erro inesperado ao deletar usuário de teste");
      return null;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    createTestUser,
    deleteTestUser,
    isCreating,
    isDeleting,
    lastDeleteResult,
  };
}
