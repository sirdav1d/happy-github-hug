import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normaliza um nome para comparação case-insensitive e sem acentos
 */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se dois nomes correspondem (match exato ou parcial por primeiro/último nome)
 */
export function namesMatch(name1: string, name2: string): boolean {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  // Match exato
  if (norm1 === norm2) return true;
  
  // Match parcial (primeiro ou último nome com mais de 2 caracteres)
  const parts1 = norm1.split(' ').filter(p => p.length > 2);
  const parts2 = norm2.split(' ').filter(p => p.length > 2);
  
  // Se algum nome tem só uma parte significativa, verificar se está contida no outro
  if (parts1.length === 1 && parts2.some(p => p === parts1[0])) return true;
  if (parts2.length === 1 && parts1.some(p => p === parts2[0])) return true;
  
  // Verificar se primeiro E último nome batem
  if (parts1.length >= 2 && parts2.length >= 2) {
    const firstMatch = parts1[0] === parts2[0];
    const lastMatch = parts1[parts1.length - 1] === parts2[parts2.length - 1];
    if (firstMatch || lastMatch) return true;
  }
  
  return false;
}
