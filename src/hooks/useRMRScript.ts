import { useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { useRMRPreparation } from "./useRMRPreparation";

interface TeamMember {
  id: string;
  name: string;
  revenue: number;
  goal: number;
}

interface RMRScriptData {
  highlight: {
    name: string;
    reason: string;
  };
  theme: string;
  goal: number;
  strategies: string[];
  video?: {
    title: string;
    url: string;
  };
  previousMonth: {
    revenue: number;
    goal: number;
  };
  team: TeamMember[];
  month: number;
  year: number;
}

interface ScriptSection {
  title: string;
  duration_minutes: number;
  content: string;
}

interface GeneratedScript {
  script_markdown: string;
  sections: ScriptSection[];
  total_duration_minutes: number;
  generated_at: string;
}

// Sanitize text for PDF - remove emojis and special characters
const sanitizeText = (text: string): string => {
  // Remove emojis and special Unicode characters
  let sanitized = text
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Media controls
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Media controls
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
    .replace(/[\u{2614}-\u{2615}]/gu, '')   // Umbrella, Hot Beverage
    .replace(/[\u{2648}-\u{2653}]/gu, '')   // Zodiac
    .replace(/[\u{267F}]/gu, '')            // Wheelchair
    .replace(/[\u{2693}]/gu, '')            // Anchor
    .replace(/[\u{26A1}]/gu, '')            // Lightning
    .replace(/[\u{26AA}-\u{26AB}]/gu, '')   // Circles
    .replace(/[\u{26BD}-\u{26BE}]/gu, '')   // Soccer, Baseball
    .replace(/[\u{26C4}-\u{26C5}]/gu, '')   // Snowman, Sun
    .replace(/[\u{26CE}]/gu, '')            // Ophiuchus
    .replace(/[\u{26D4}]/gu, '')            // No Entry
    .replace(/[\u{26EA}]/gu, '')            // Church
    .replace(/[\u{26F2}-\u{26F3}]/gu, '')   // Fountain, Golf
    .replace(/[\u{26F5}]/gu, '')            // Sailboat
    .replace(/[\u{26FA}]/gu, '')            // Tent
    .replace(/[\u{26FD}]/gu, '')            // Fuel Pump
    .replace(/[\u{2702}]/gu, '')            // Scissors
    .replace(/[\u{2705}]/gu, '')            // Check Mark
    .replace(/[\u{2708}-\u{270D}]/gu, '')   // Airplane to Writing Hand
    .replace(/[\u{270F}]/gu, '')            // Pencil
    .replace(/[\u{2712}]/gu, '')            // Black Nib
    .replace(/[\u{2714}]/gu, '')            // Check Mark
    .replace(/[\u{2716}]/gu, '')            // X Mark
    .replace(/[\u{271D}]/gu, '')            // Latin Cross
    .replace(/[\u{2721}]/gu, '')            // Star of David
    .replace(/[\u{2728}]/gu, '')            // Sparkles
    .replace(/[\u{2733}-\u{2734}]/gu, '')   // Eight Spoked Asterisks
    .replace(/[\u{2744}]/gu, '')            // Snowflake
    .replace(/[\u{2747}]/gu, '')            // Sparkle
    .replace(/[\u{274C}]/gu, '')            // Cross Mark
    .replace(/[\u{274E}]/gu, '')            // Cross Mark
    .replace(/[\u{2753}-\u{2755}]/gu, '')   // Question Marks
    .replace(/[\u{2757}]/gu, '')            // Exclamation Mark
    .replace(/[\u{2763}-\u{2764}]/gu, '')   // Heart
    .replace(/[\u{2795}-\u{2797}]/gu, '')   // Plus, Minus, Division
    .replace(/[\u{27A1}]/gu, '')            // Right Arrow
    .replace(/[\u{27B0}]/gu, '')            // Curly Loop
    .replace(/[\u{27BF}]/gu, '')            // Double Curly Loop
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy Dash
    .replace(/[\u{303D}]/gu, '')            // Part Alternation Mark
    .replace(/[\u{3297}]/gu, '')            // Circled Ideograph Congratulation
    .replace(/[\u{3299}]/gu, '');           // Circled Ideograph Secret

  // Replace special characters with ASCII equivalents
  sanitized = sanitized
    .replace(/–/g, '-')
    .replace(/—/g, '-')
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .replace(/…/g, '...')
    .replace(/•/g, '-')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/↓/g, 'v')
    .replace(/↑/g, '^')
    .replace(/✓/g, '[OK]')
    .replace(/✔/g, '[OK]')
    .replace(/✗/g, '[X]')
    .replace(/✘/g, '[X]')
    .replace(/★/g, '*')
    .replace(/☆/g, '*')
    .replace(/♦/g, '<>')
    .replace(/♣/g, '+')
    .replace(/♠/g, '^')
    .replace(/♥/g, '<3')
    .replace(/©/g, '(c)')
    .replace(/®/g, '(R)')
    .replace(/™/g, '(TM)')
    .replace(/°/g, 'o')
    .replace(/±/g, '+/-')
    .replace(/×/g, 'x')
    .replace(/÷/g, '/')
    .replace(/≠/g, '!=')
    .replace(/≤/g, '<=')
    .replace(/≥/g, '>=')
    .replace(/∞/g, 'oo')
    .replace(/√/g, 'raiz')
    .replace(/∑/g, 'soma')
    .replace(/∆/g, 'delta')
    .replace(/π/g, 'pi')
    .replace(/Ω/g, 'omega');

  // Keep Portuguese accented characters but ensure valid encoding
  return sanitized;
};

export const useRMRScript = () => {
  const { user } = useAuth();
  const { updatePreparation, preparationStatus } = useRMRPreparation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate script via edge function
  const generateScript = useCallback(async (rmrData: RMRScriptData): Promise<GeneratedScript | null> => {
    if (!user?.id) {
      toast.error("Usuario nao autenticado");
      return null;
    }

    setIsGenerating(true);

    try {
      const response = await supabase.functions.invoke('generate-rmr-script', {
        body: { rmrData }
      });

      if (response.error) {
        if (response.error.message?.includes("429")) {
          toast.error("Limite de requisicoes excedido. Tente novamente em alguns minutos.");
        } else if (response.error.message?.includes("402")) {
          toast.error("Creditos insuficientes. Adicione creditos a sua conta.");
        } else {
          throw response.error;
        }
        return null;
      }

      const generatedScript = response.data as GeneratedScript;

      // Save to preparation status with version control
      updatePreparation({
        generated_script_markdown: generatedScript.script_markdown,
        script_month: rmrData.month,
        script_year: rmrData.year,
        script_generated_at: new Date().toISOString(),
      });

      toast.success("Roteiro gerado com sucesso!");
      return generatedScript;

    } catch (error) {
      console.error("Error generating script:", error);
      toast.error("Erro ao gerar roteiro. Tente novamente.");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [user?.id, updatePreparation]);

  // Download script as PDF with sanitized text
  const downloadPDF = useCallback(async (scriptMarkdown: string, rmrData?: { month: number; year: number }) => {
    if (!scriptMarkdown) {
      toast.error("Nenhum roteiro disponivel para download");
      return;
    }

    setIsDownloading(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = margin;
      let isInCoverSection = true; // Track if we're still in cover/hero area

      const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
      ];

      // Helper to add page if needed
      const checkAddPage = (neededHeight: number = 10) => {
        if (yPosition + neededHeight > pageHeight - 25) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // Add footer to all pages at the end
      const addFooters = () => {
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Página ${i} de ${totalPages}`,
            margin,
            pageHeight - 10
          );
          doc.text(
            `Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: "right" }
          );
        }
      };

      // === COVER PAGE ===
      // Draw a decorative header bar
      doc.setFillColor(180, 120, 0); // Amber
      doc.rect(0, 0, pageWidth, 8, 'F');

      yPosition = 35;

      // Main title centered
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(40, 40, 40);
      const mainTitle = "ROTEIRO COMPLETO PARA";
      const mainTitle2 = "REUNIÃO DE METAS E RECONHECIMENTO";
      doc.text(mainTitle, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;
      doc.text(mainTitle2, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 12;

      // Subtitle with month/year
      doc.setFontSize(14);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      const subtitle = rmrData 
        ? `${monthNames[rmrData.month - 1]} ${rmrData.year}`
        : "Roteiro RMR";
      doc.text(subtitle, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;

      // Duration badge
      doc.setFontSize(11);
      doc.setTextColor(180, 120, 0);
      doc.text("Duração: 45 minutos", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;

      // Decorative line
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.5);
      doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
      yPosition += 15;

      doc.setTextColor(0, 0, 0);

      // Process markdown content - skip cover headers that we already rendered
      const lines = scriptMarkdown.split("\n");
      const skipPatterns = [
        /^#\s*ROTEIRO COMPLETO/i,
        /^#\s*Reunião de Metas/i,
        /^#\s*TEMA:/i,
        /^#\s*DURAÇÃO TOTAL/i,
        /^#\s*RMR\s*[-–]/i,
        /^#\s*Roteiro\s*da\s*RMR/i,
        /^#\s*Roteiro\s*RMR/i,
        /^#+\s*$/,
      ];
      
      for (const line of lines) {
        const trimmedLine = sanitizeText(line.trim());
        
        if (!trimmedLine) {
          yPosition += 3;
          continue;
        }

        // Skip lines that were already rendered in cover
        if (isInCoverSection) {
          const shouldSkip = skipPatterns.some(pattern => pattern.test(trimmedLine));
          if (shouldSkip) continue;
          
          // Once we hit a section header (## 1. ABERTURA), we're past the cover
          if (trimmedLine.match(/^##\s*\d+\.\s*/)) {
            isInCoverSection = false;
          }
        }

        // Section headers (## 1. ABERTURA, etc.)
        if (trimmedLine.match(/^##\s*\d+\.\s*/) || trimmedLine.startsWith("## ")) {
          checkAddPage(20);
          yPosition += 8;
          
          // Draw section separator line
          doc.setDrawColor(180, 120, 0);
          doc.setLineWidth(1);
          doc.line(margin, yPosition - 3, pageWidth - margin, yPosition - 3);
          
          doc.setFontSize(13);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(180, 120, 0);
          const headerText = trimmedLine.replace(/^##\s*/, "").replace(/\*\*/g, "");
          doc.text(headerText, margin, yPosition);
          yPosition += 10;
          doc.setTextColor(0, 0, 0);
        } 
        // Sub-headers (### Fala Roteirizada, etc.)
        else if (trimmedLine.startsWith("### ")) {
          checkAddPage(12);
          yPosition += 4;
          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(60, 60, 60);
          const subHeaderText = trimmedLine.replace("### ", "").replace(/\*\*/g, "");
          doc.text(subHeaderText, margin, yPosition);
          yPosition += 7;
          doc.setTextColor(0, 0, 0);
        } 
        // Main headers (# something) - centered in content area
        else if (trimmedLine.startsWith("# ")) {
          checkAddPage(18);
          yPosition += 10;
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(40, 40, 40);
          const mainHeaderText = trimmedLine.replace("# ", "").replace(/\*\*/g, "");
          const splitHeader = doc.splitTextToSize(mainHeaderText, maxWidth);
          splitHeader.forEach((headerLine: string) => {
            doc.text(headerLine, pageWidth / 2, yPosition, { align: "center" });
            yPosition += 8;
          });
          yPosition += 4;
          doc.setTextColor(0, 0, 0);
        } 
        // List items with labels (- Tempo:, - Objetivo:, etc.)
        else if (trimmedLine.match(/^[-*]\s*(Tempo|Objetivo|Dinâmica|Checklist|Visual|Transição):/i)) {
          checkAddPage(10);
          doc.setFontSize(10);
          const labelMatch = trimmedLine.match(/^[-*]\s*(Tempo|Objetivo|Dinâmica|Checklist|Visual|Transição):\s*(.*)/i);
          if (labelMatch) {
            const label = labelMatch[1];
            const value = sanitizeText(labelMatch[2] || "");
            
            // Label in bold
            doc.setFont("helvetica", "bold");
            doc.setTextColor(100, 100, 100);
            doc.text(`${label}:`, margin + 5, yPosition);
            
            // Value in normal
            doc.setFont("helvetica", "normal");
            doc.setTextColor(40, 40, 40);
            const labelWidth = doc.getTextWidth(`${label}: `);
            const valueLines = doc.splitTextToSize(value, maxWidth - 10 - labelWidth);
            valueLines.forEach((valLine: string, idx: number) => {
              if (idx === 0) {
                doc.text(valLine, margin + 5 + labelWidth, yPosition);
              } else {
                yPosition += 5;
                checkAddPage(6);
                doc.text(valLine, margin + 5 + labelWidth, yPosition);
              }
            });
            yPosition += 6;
          }
        }
        // Regular list items
        else if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ")) {
          checkAddPage(8);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
          const bulletText = trimmedLine.replace(/^[-*]\s/, "• ").replace(/\*\*/g, "");
          const splitText = doc.splitTextToSize(bulletText, maxWidth - 10);
          splitText.forEach((textLine: string) => {
            checkAddPage(6);
            doc.text(textLine, margin + 5, yPosition);
            yPosition += 5;
          });
          yPosition += 1;
        } 
        // Quotes (suggested speech) - styled as dialogue
        else if (trimmedLine.startsWith(">") || trimmedLine.startsWith('"') || trimmedLine.startsWith("(")) {
          checkAddPage(10);
          doc.setFontSize(10);
          doc.setFont("helvetica", "italic");
          doc.setTextColor(60, 60, 60);
          
          // Draw left border for quotes
          const quoteText = trimmedLine.replace(/^>\s*/, "");
          const splitQuote = doc.splitTextToSize(quoteText, maxWidth - 15);
          
          const quoteStartY = yPosition;
          splitQuote.forEach((quoteLine: string) => {
            checkAddPage(6);
            doc.text(quoteLine, margin + 8, yPosition);
            yPosition += 5;
          });
          
          // Left accent bar
          doc.setDrawColor(180, 120, 0);
          doc.setLineWidth(1.5);
          doc.line(margin + 3, quoteStartY - 3, margin + 3, yPosition - 2);
          
          doc.setTextColor(0, 0, 0);
          doc.setFont("helvetica", "normal");
          yPosition += 3;
        } 
        // Regular paragraphs
        else {
          checkAddPage(8);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(40, 40, 40);
          const cleanText = trimmedLine.replace(/\*\*/g, "");
          const splitParagraph = doc.splitTextToSize(cleanText, maxWidth);
          splitParagraph.forEach((paraLine: string) => {
            checkAddPage(6);
            doc.text(paraLine, margin, yPosition);
            yPosition += 5;
          });
          yPosition += 2;
        }
      }

      // Add footers to all pages
      addFooters();

      // Save
      const filename = rmrData 
        ? `roteiro-rmr-${monthNames[rmrData.month - 1].toLowerCase()}-${rmrData.year}.pdf`
        : "roteiro-rmr.pdf";
      doc.save(filename);

      toast.success("PDF baixado com sucesso!");

    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsDownloading(false);
    }
  }, []);

  // Get stored script from preparation status
  const storedScript = preparationStatus?.generated_script_markdown || null;
  
  // Check if the script corresponds to the current RMR month/year
  const hasValidScript = useCallback((targetMonth: number, targetYear: number): boolean => {
    if (!storedScript || !preparationStatus) return false;
    const prepStatus = preparationStatus as any;
    return prepStatus.script_month === targetMonth && prepStatus.script_year === targetYear;
  }, [storedScript, preparationStatus]);

  // Get script generation date
  const scriptGeneratedAt = (preparationStatus as any)?.script_generated_at || null;

  return {
    generateScript,
    downloadPDF,
    isGenerating,
    isDownloading,
    storedScript,
    hasValidScript,
    scriptGeneratedAt,
    scriptMonth: (preparationStatus as any)?.script_month,
    scriptYear: (preparationStatus as any)?.script_year
  };
};
