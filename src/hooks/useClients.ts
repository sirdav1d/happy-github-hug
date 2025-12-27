import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, ClientFormData } from '@/types/sales';
import { useToast } from '@/hooks/use-toast';

interface UseClientsReturn {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
  createClient: (data: ClientFormData) => Promise<Client | null>;
  updateClient: (id: string, data: Partial<ClientFormData>) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  fetchClients: () => Promise<void>;
  searchClients: (query: string) => Client[];
}

export default function useClients(userId: string | undefined): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClients = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      setClients((data || []) as Client[]);
    } catch (err: any) {
      console.error('Error fetching clients:', err);
      setError(err.message || 'Erro ao carregar clientes');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const createClient = useCallback(async (data: ClientFormData): Promise<Client | null> => {
    if (!userId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data: newClient, error: insertError } = await supabase
        .from('clients')
        .insert({
          user_id: userId,
          name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          notes: data.notes || null,
          first_purchase_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const typedClient = newClient as Client;
      setClients(prev => [...prev, typedClient].sort((a, b) => a.name.localeCompare(b.name)));
      
      toast({
        title: 'Cliente cadastrado!',
        description: data.name,
      });

      return typedClient;
    } catch (err: any) {
      console.error('Error creating client:', err);
      setError(err.message || 'Erro ao cadastrar cliente');
      toast({
        title: 'Erro ao cadastrar cliente',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const updateClient = useCallback(async (id: string, data: Partial<ClientFormData>): Promise<Client | null> => {
    if (!userId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const { data: updatedClient, error: updateError } = await supabase
        .from('clients')
        .update(data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;

      const typedClient = updatedClient as Client;
      setClients(prev => prev.map(c => c.id === id ? typedClient : c));

      return typedClient;
    } catch (err: any) {
      console.error('Error updating client:', err);
      setError(err.message || 'Erro ao atualizar cliente');
      toast({
        title: 'Erro ao atualizar cliente',
        description: err.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('clients')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setClients(prev => prev.filter(c => c.id !== id));

      return true;
    } catch (err: any) {
      console.error('Error deleting client:', err);
      setError(err.message || 'Erro ao remover cliente');
      toast({
        title: 'Erro ao remover cliente',
        description: err.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  const searchClients = useCallback((query: string): Client[] => {
    if (!query.trim()) return clients;
    const lowerQuery = query.toLowerCase();
    return clients.filter(c => 
      c.name.toLowerCase().includes(lowerQuery) ||
      c.email?.toLowerCase().includes(lowerQuery) ||
      c.phone?.includes(query)
    );
  }, [clients]);

  useEffect(() => {
    if (userId) {
      fetchClients();
    }
  }, [userId, fetchClients]);

  return {
    clients,
    isLoading,
    error,
    createClient,
    updateClient,
    deleteClient,
    fetchClients,
    searchClients,
  };
}
