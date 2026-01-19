import { useState } from "react";
import PptxGenJS from "pptxgenjs";
import { toast } from "sonner";
import { generateThumbnailUrl } from "@/lib/youtubeUtils";

interface TeamMember {
  id: string;
  name: string;
  revenue: number;
  goal: number;
}

interface WhitelabelData {
  systemName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

interface RMRSlideData {
  month: number;
  year: number;
  theme: string;
  highlight: {
    name: string;
    reason: string;
  };
  previousMonth: {
    revenue: number;
    goal: number;
  };
  goal: number;
  strategies: string[];
  video?: {
    title: string;
    url: string;
    youtubeId?: string;
  };
  team: TeamMember[];
  companyName?: string;
  whitelabel?: WhitelabelData;
  rmrId?: string;
  onSlidesGenerated?: (rmrId: string) => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Premium color palette for professional consulting-grade presentations
const COLORS_PRO = {
  // Dark foundation
  darkPrimary: "0F172A",    // slate-900
  darkSecondary: "1E293B",  // slate-800
  darkTertiary: "334155",   // slate-700
  
  // Light foundation
  lightPrimary: "F8FAFC",   // slate-50
  lightSecondary: "F1F5F9", // slate-100
  lightTertiary: "E2E8F0",  // slate-200
  
  // Brand colors
  primary: "3B82F6",        // blue-500
  primaryDark: "1D4ED8",    // blue-700
  primaryLight: "DBEAFE",   // blue-100
  
  secondary: "8B5CF6",      // violet-500
  secondaryDark: "6D28D9",  // violet-700
  secondaryLight: "EDE9FE", // violet-100
  
  accent: "06B6D4",         // cyan-500
  accentDark: "0891B2",     // cyan-600
  accentLight: "CFFAFE",    // cyan-100
  
  // Metallic accents
  gold: "F59E0B",           // amber-500
  goldDark: "D97706",       // amber-600
  goldLight: "FEF3C7",      // amber-100
  silver: "94A3B8",         // slate-400
  bronze: "EA580C",         // orange-600
  
  // Status colors
  success: "10B981",        // emerald-500
  successLight: "D1FAE5",   // emerald-100
  successDark: "059669",    // emerald-600
  
  danger: "EF4444",         // red-500
  dangerLight: "FEE2E2",    // red-100
  dangerDark: "DC2626",     // red-600
  
  // Neutrals
  white: "FFFFFF",
  black: "000000",
  muted: "64748B",          // slate-500
  mutedLight: "94A3B8",     // slate-400
  
  // Gradient simulation colors
  gradientStart: "1E1B4B",  // indigo-950
  gradientMid: "4C1D95",    // violet-900
  gradientEnd: "0F766E",    // teal-700
};

// Rank colors for top performers
const RANK_COLORS = [
  { bar: "F59E0B", text: "78350F", bg: "FEF3C7", medal: "🥇" }, // Gold
  { bar: "94A3B8", text: "334155", bg: "F1F5F9", medal: "🥈" }, // Silver
  { bar: "EA580C", text: "7C2D12", bg: "FED7AA", medal: "🥉" }, // Bronze
  { bar: "3B82F6", text: "1E3A8A", bg: "DBEAFE", medal: "" },   // Blue
  { bar: "8B5CF6", text: "4C1D95", bg: "EDE9FE", medal: "" },   // Violet
];

export function useRMRSlides() {
  const [isGenerating, setIsGenerating] = useState(false);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyCompact = (value: number): string => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(0)}K`;
    }
    return formatCurrency(value);
  };

  const getInitials = (name: string): string => {
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const generateSlides = async (data: RMRSlideData): Promise<boolean> => {
    setIsGenerating(true);
    
    try {
      const pptx = new PptxGenJS();
      
      // Presentation metadata
      pptx.author = data.whitelabel?.systemName || "Central de Gestão Comercial";
      pptx.title = `RMR - ${MONTHS[data.month - 1]} ${data.year}`;
      pptx.subject = "Reunião de Metas e Reconhecimento";
      pptx.company = data.companyName || "Empresa";
      pptx.layout = "LAYOUT_16x9";

      // ============================================
      // SLIDE 1: ABERTURA CINEMATOGRÁFICA
      // ============================================
      const slide1 = pptx.addSlide();
      
      // Multi-layer gradient background simulation
      slide1.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { type: "solid", color: COLORS_PRO.gradientStart },
      });
      
      // Organic shapes for depth (aurora boreal effect)
      slide1.addShape(pptx.ShapeType.ellipse, {
        x: 7, y: -1.5, w: 5, h: 5,
        fill: { type: "solid", color: COLORS_PRO.secondary },
      });
      slide1.addShape(pptx.ShapeType.ellipse, {
        x: 8, y: -0.5, w: 4, h: 4,
        fill: { type: "solid", color: COLORS_PRO.accent },
      });
      slide1.addShape(pptx.ShapeType.ellipse, {
        x: -1.5, y: 3, w: 4, h: 4,
        fill: { type: "solid", color: COLORS_PRO.primaryDark },
      });
      slide1.addShape(pptx.ShapeType.ellipse, {
        x: 0, y: 4, w: 3, h: 3,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });
      slide1.addShape(pptx.ShapeType.ellipse, {
        x: 5, y: 4.5, w: 2, h: 2,
        fill: { type: "solid", color: COLORS_PRO.accentDark },
      });

      // Decorative gold line
      slide1.addShape(pptx.ShapeType.rect, {
        x: 3, y: 1.3, w: 4, h: 0.04,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });

      // Main title with dramatic typography
      slide1.addText("REUNIÃO DE METAS", {
        x: 0.5, y: 1.5, w: 9, h: 0.8,
        fontSize: 44, fontFace: "Arial Black", bold: true, color: COLORS_PRO.white,
        align: "center", charSpacing: 6,
      });
      slide1.addText("E RECONHECIMENTO", {
        x: 0.5, y: 2.2, w: 9, h: 0.6,
        fontSize: 32, fontFace: "Arial", bold: true, color: COLORS_PRO.gold,
        align: "center", charSpacing: 4,
      });

      // Month/Year badge
      slide1.addShape(pptx.ShapeType.roundRect, {
        x: 3.5, y: 3.1, w: 3, h: 0.6,
        fill: { type: "solid", color: COLORS_PRO.white },
        rectRadius: 0.15,
      });
      slide1.addText(`${MONTHS[data.month - 1].toUpperCase()} ${data.year}`, {
        x: 3.5, y: 3.1, w: 3, h: 0.6,
        fontSize: 18, fontFace: "Arial", bold: true, color: COLORS_PRO.gradientStart,
        align: "center", valign: "middle",
      });

      // Theme in glassmorphism-style card
      if (data.theme) {
        slide1.addShape(pptx.ShapeType.roundRect, {
          x: 1, y: 4, w: 8, h: 0.9,
          fill: { type: "solid", color: COLORS_PRO.white },
          rectRadius: 0.1,
          shadow: { type: "outer", blur: 4, offset: 2, angle: 45, opacity: 0.15 },
        });
        slide1.addText(`"${data.theme}"`, {
          x: 1, y: 4, w: 8, h: 0.9,
          fontSize: 16, fontFace: "Arial", italic: true, color: COLORS_PRO.darkPrimary,
          align: "center", valign: "middle",
        });
      }

      // Company name watermark
      slide1.addText(data.companyName?.toUpperCase() || "", {
        x: 0.3, y: 5, w: 4, h: 0.3,
        fontSize: 10, fontFace: "Arial", color: "FFFFFF40",
        align: "left",
      });

      // RMR Badge
      slide1.addShape(pptx.ShapeType.roundRect, {
        x: 8.5, y: 5, w: 1.2, h: 0.35,
        fill: { type: "solid", color: COLORS_PRO.gold },
        rectRadius: 0.05,
      });
      slide1.addText("RMR", {
        x: 8.5, y: 5, w: 1.2, h: 0.35,
        fontSize: 12, fontFace: "Arial", bold: true, color: COLORS_PRO.darkPrimary,
        align: "center", valign: "middle",
      });

      // Speaker notes
      slide1.addNotes(
        "🎬 ABERTURA CINEMATOGRÁFICA (5 minutos)\n\n" +
        "═══════════════════════════════════════\n" +
        "📋 ROTEIRO SUGERIDO:\n" +
        "═══════════════════════════════════════\n\n" +
        "1️⃣ ENTRADA (1 min)\n" +
        "   • Entre com energia e entusiasmo\n" +
        "   • Cumprimente a equipe: \"Bom dia/tarde, time de campeões!\"\n" +
        "   • Aguarde todos se acomodarem\n\n" +
        "2️⃣ CONTEXTO (2 min)\n" +
        "   • \"Hoje vamos celebrar nossas conquistas de " + MONTHS[data.month - 1] + "\"\n" +
        "   • \"E mais importante: alinhar nossa estratégia para o próximo mês\"\n\n" +
        "3️⃣ TEMA DO MÊS (2 min)\n" +
        "   • Introduza o tema: \"" + data.theme + "\"\n" +
        "   • Conecte com a realidade do time\n" +
        "   • Pergunte: \"O que esse tema significa para vocês?\"\n\n" +
        "═══════════════════════════════════════\n" +
        "💡 DICAS DE LINGUAGEM CORPORAL:\n" +
        "   • Mantenha contato visual\n" +
        "   • Use gestos amplos e abertos\n" +
        "   • Sorria naturalmente\n" +
        "═══════════════════════════════════════"
      );

      // ============================================
      // SLIDE 2: RESULTADOS - DASHBOARD EXECUTIVO
      // ============================================
      const slide2 = pptx.addSlide();
      
      // Clean professional background
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { type: "solid", color: COLORS_PRO.lightPrimary },
      });
      
      // Header accent bar
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: COLORS_PRO.primary },
      });

      // Title with accent
      slide2.addText("📊 RESULTADOS DO MÊS", {
        x: 0.5, y: 0.3, w: 9, h: 0.5,
        fontSize: 28, fontFace: "Arial", bold: true, color: COLORS_PRO.darkPrimary,
      });
      slide2.addText(MONTHS[data.month - 1].toUpperCase(), {
        x: 0.5, y: 0.7, w: 9, h: 0.3,
        fontSize: 12, fontFace: "Arial", color: COLORS_PRO.muted, charSpacing: 3,
      });

      const percentAchieved = data.previousMonth.goal > 0 
        ? (data.previousMonth.revenue / data.previousMonth.goal) * 100 
        : 0;
      const achievedColor = percentAchieved >= 100 ? COLORS_PRO.success : COLORS_PRO.danger;
      const achievedBg = percentAchieved >= 100 ? COLORS_PRO.successLight : COLORS_PRO.dangerLight;

      // Executive metrics - 3 columns
      // Column 1: Meta
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: 0.3, y: 1.1, w: 3, h: 1.4,
        fill: { type: "solid", color: COLORS_PRO.white },
        rectRadius: 0.1,
        shadow: { type: "outer", blur: 3, offset: 1, angle: 45, opacity: 0.1 },
      });
      slide2.addText("META", {
        x: 0.3, y: 1.2, w: 3, h: 0.3,
        fontSize: 11, fontFace: "Arial", bold: true, color: COLORS_PRO.muted,
        align: "center", charSpacing: 2,
      });
      slide2.addText(formatCurrency(data.previousMonth.goal), {
        x: 0.3, y: 1.5, w: 3, h: 0.6,
        fontSize: 26, fontFace: "Arial", bold: true, color: COLORS_PRO.primary,
        align: "center", valign: "middle",
      });
      slide2.addShape(pptx.ShapeType.rect, {
        x: 1.15, y: 2.2, w: 1.3, h: 0.06,
        fill: { type: "solid", color: COLORS_PRO.primary },
      });

      // Column 2: Realizado (larger, central focus)
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: 3.5, y: 1, w: 3.4, h: 1.6,
        fill: { type: "solid", color: achievedBg },
        line: { color: achievedColor, width: 2 },
        rectRadius: 0.1,
        shadow: { type: "outer", blur: 5, offset: 2, angle: 45, opacity: 0.15 },
      });
      slide2.addText("REALIZADO", {
        x: 3.5, y: 1.1, w: 3.4, h: 0.3,
        fontSize: 11, fontFace: "Arial", bold: true, color: achievedColor,
        align: "center", charSpacing: 2,
      });
      slide2.addText(formatCurrency(data.previousMonth.revenue), {
        x: 3.5, y: 1.45, w: 3.4, h: 0.7,
        fontSize: 32, fontFace: "Arial Black", bold: true, color: achievedColor,
        align: "center", valign: "middle",
      });
      // Arrow indicator
      const arrowText = percentAchieved >= 100 ? "▲" : "▼";
      slide2.addText(arrowText, {
        x: 4.85, y: 2.15, w: 0.7, h: 0.35,
        fontSize: 16, color: achievedColor, align: "center", valign: "middle",
      });

      // Column 3: Variação
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: 7.1, y: 1.1, w: 2.5, h: 1.4,
        fill: { type: "solid", color: COLORS_PRO.white },
        rectRadius: 0.1,
        shadow: { type: "outer", blur: 3, offset: 1, angle: 45, opacity: 0.1 },
      });
      slide2.addText("ATINGIMENTO", {
        x: 7.1, y: 1.2, w: 2.5, h: 0.3,
        fontSize: 10, fontFace: "Arial", bold: true, color: COLORS_PRO.muted,
        align: "center", charSpacing: 1,
      });
      // Large circular progress ring simulation
      slide2.addShape(pptx.ShapeType.ellipse, {
        x: 7.65, y: 1.55, w: 0.9, h: 0.9,
        fill: { type: "solid", color: COLORS_PRO.lightTertiary },
        line: { color: achievedColor, width: 4 },
      });
      slide2.addText(`${percentAchieved.toFixed(0)}%`, {
        x: 7.1, y: 1.55, w: 2.5, h: 0.9,
        fontSize: 20, fontFace: "Arial", bold: true, color: achievedColor,
        align: "center", valign: "middle",
      });

      // TOP 5 Section - Premium horizontal bars
      slide2.addText("🏆 TOP 5 VENDEDORES", {
        x: 0.3, y: 2.7, w: 9, h: 0.35,
        fontSize: 16, fontFace: "Arial", bold: true, color: COLORS_PRO.darkPrimary,
      });

      const topPerformers = [...data.team]
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const maxRevenue = topPerformers[0]?.revenue || 1;
      const barMaxWidth = 5.5;
      const barStartX = 2.0;
      let barY = 3.15;

      topPerformers.forEach((performer, idx) => {
        const barWidth = (performer.revenue / maxRevenue) * barMaxWidth;
        const rankColor = RANK_COLORS[idx];
        
        // Avatar circle with initials
        slide2.addShape(pptx.ShapeType.ellipse, {
          x: 0.35, y: barY - 0.05, w: 0.5, h: 0.5,
          fill: { type: "solid", color: rankColor.bg },
          line: { color: rankColor.bar, width: 1.5 },
        });
        slide2.addText(getInitials(performer.name), {
          x: 0.35, y: barY - 0.05, w: 0.5, h: 0.5,
          fontSize: 9, fontFace: "Arial", bold: true, color: rankColor.text,
          align: "center", valign: "middle",
        });

        // Name
        slide2.addText(`${rankColor.medal} ${performer.name.split(" ")[0]}`, {
          x: 0.9, y: barY, w: 1.1, h: 0.4,
          fontSize: 10, fontFace: "Arial", bold: idx < 3, color: COLORS_PRO.darkSecondary,
          align: "left", valign: "middle",
        });

        // Gradient-style bar
        slide2.addShape(pptx.ShapeType.roundRect, {
          x: barStartX, y: barY + 0.05, w: barWidth, h: 0.3,
          fill: { type: "solid", color: rankColor.bar },
          rectRadius: 0.05,
        });

        // Value inside bar (if bar is wide enough)
        if (barWidth > 1.5) {
          slide2.addText(formatCurrencyCompact(performer.revenue), {
            x: barStartX, y: barY + 0.05, w: barWidth - 0.1, h: 0.3,
            fontSize: 9, fontFace: "Arial", bold: true, color: COLORS_PRO.white,
            align: "right", valign: "middle",
          });
        } else {
          slide2.addText(formatCurrencyCompact(performer.revenue), {
            x: barStartX + barWidth + 0.1, y: barY + 0.05, w: 1, h: 0.3,
            fontSize: 9, fontFace: "Arial", bold: true, color: COLORS_PRO.darkPrimary,
            align: "left", valign: "middle",
          });
        }

        barY += 0.45;
      });

      // Quick insight card
      const insightText = percentAchieved >= 100 
        ? `✨ Meta superada! +${(percentAchieved - 100).toFixed(0)}% acima do objetivo`
        : `📈 Faltaram ${(100 - percentAchieved).toFixed(0)}% para atingir a meta`;
      
      slide2.addShape(pptx.ShapeType.roundRect, {
        x: 5.8, y: 5, w: 3.9, h: 0.4,
        fill: { type: "solid", color: achievedBg },
        rectRadius: 0.1,
      });
      slide2.addText(insightText, {
        x: 5.8, y: 5, w: 3.9, h: 0.4,
        fontSize: 9, fontFace: "Arial", color: achievedColor,
        align: "center", valign: "middle",
      });

      // Footer
      slide2.addShape(pptx.ShapeType.rect, {
        x: 0, y: 5.5, w: "100%", h: 0.08,
        fill: { type: "solid", color: COLORS_PRO.primary },
      });

      slide2.addNotes(
        "📊 RESULTADOS DO MÊS (10 minutos)\n\n" +
        "═══════════════════════════════════════\n" +
        "📋 DADOS PRINCIPAIS:\n" +
        "═══════════════════════════════════════\n\n" +
        `• Meta: ${formatCurrency(data.previousMonth.goal)}\n` +
        `• Realizado: ${formatCurrency(data.previousMonth.revenue)}\n` +
        `• Atingimento: ${percentAchieved.toFixed(1)}%\n\n` +
        "═══════════════════════════════════════\n" +
        "🏆 RANKING DOS TOP PERFORMERS:\n" +
        "═══════════════════════════════════════\n" +
        topPerformers.map((p, i) => `${i + 1}. ${p.name}: ${formatCurrency(p.revenue)}`).join("\n") +
        "\n\n═══════════════════════════════════════\n" +
        "📋 ROTEIRO SUGERIDO:\n" +
        "═══════════════════════════════════════\n\n" +
        "1️⃣ VISÃO GERAL (3 min)\n" +
        "   • Mostre os números principais\n" +
        "   • Celebre se bateu a meta: \"Parabéns, time!\"\n" +
        "   • Se não bateu: foque no que aprendemos\n\n" +
        "2️⃣ TOP PERFORMERS (5 min)\n" +
        "   • Chame cada um pelo nome\n" +
        "   • Peça aplausos para os 3 primeiros\n" +
        "   • Pergunte: \"O que fez diferença esse mês?\"\n\n" +
        "3️⃣ ANÁLISE (2 min)\n" +
        "   • \"O que funcionou bem?\"\n" +
        "   • \"O que podemos melhorar?\"\n\n" +
        "💡 DICA: Mantenha o tom positivo mesmo se a meta não foi atingida!"
      );

      // ============================================
      // SLIDE 3: RECONHECIMENTO - MOMENTO ESTRELA
      // ============================================
      const slide3 = pptx.addSlide();
      
      // Spotlight background with radial effect
      slide3.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { type: "solid", color: COLORS_PRO.gradientMid },
      });
      slide3.addShape(pptx.ShapeType.ellipse, {
        x: 2, y: 0.5, w: 6, h: 5,
        fill: { type: "solid", color: COLORS_PRO.secondaryDark },
      });
      slide3.addShape(pptx.ShapeType.ellipse, {
        x: 3, y: 1, w: 4, h: 4,
        fill: { type: "solid", color: COLORS_PRO.secondary },
      });

      // Stars decorations
      slide3.addShape(pptx.ShapeType.star5, {
        x: 0.5, y: 0.5, w: 0.6, h: 0.6,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });
      slide3.addShape(pptx.ShapeType.star5, {
        x: 9, y: 0.3, w: 0.5, h: 0.5,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });
      slide3.addShape(pptx.ShapeType.star5, {
        x: 8.5, y: 4.5, w: 0.4, h: 0.4,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });
      slide3.addShape(pptx.ShapeType.star5, {
        x: 0.8, y: 4.8, w: 0.35, h: 0.35,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });

      // "DESTAQUE DO MÊS" sash/banner
      slide3.addShape(pptx.ShapeType.rect, {
        x: 2.5, y: 0.25, w: 5, h: 0.5,
        fill: { type: "solid", color: COLORS_PRO.gold },
        shadow: { type: "outer", blur: 3, offset: 2, angle: 45, opacity: 0.3 },
      });
      slide3.addText("⭐ DESTAQUE DO MÊS ⭐", {
        x: 2.5, y: 0.25, w: 5, h: 0.5,
        fontSize: 18, fontFace: "Arial", bold: true, color: COLORS_PRO.darkPrimary,
        align: "center", valign: "middle",
      });

      // Large central star
      slide3.addShape(pptx.ShapeType.star5, {
        x: 4, y: 1, w: 2, h: 2,
        fill: { type: "solid", color: COLORS_PRO.gold },
        shadow: { type: "outer", blur: 8, offset: 3, angle: 45, opacity: 0.4 },
      });
      // Layered stars for depth
      slide3.addShape(pptx.ShapeType.star5, {
        x: 3.3, y: 1.3, w: 0.7, h: 0.7,
        fill: { type: "solid", color: COLORS_PRO.goldDark },
      });
      slide3.addShape(pptx.ShapeType.star5, {
        x: 6.2, y: 1.5, w: 0.6, h: 0.6,
        fill: { type: "solid", color: COLORS_PRO.goldDark },
      });

      // Highlight name with glow effect simulation
      slide3.addText(data.highlight.name.toUpperCase(), {
        x: 0.5, y: 3.1, w: 9, h: 0.8,
        fontSize: 38, fontFace: "Arial Black", bold: true, color: COLORS_PRO.white,
        align: "center", charSpacing: 4,
        shadow: { type: "outer", blur: 6, offset: 0, angle: 0, opacity: 0.5, color: COLORS_PRO.gold },
      });

      // Reason in premium quote card
      slide3.addShape(pptx.ShapeType.roundRect, {
        x: 1, y: 4, w: 8, h: 1.1,
        fill: { type: "solid", color: COLORS_PRO.white },
        rectRadius: 0.1,
        shadow: { type: "outer", blur: 5, offset: 2, angle: 45, opacity: 0.2 },
      });
      // Decorative quotes
      slide3.addText("\u201C", {
        x: 1.2, y: 3.85, w: 0.5, h: 0.5,
        fontSize: 40, fontFace: "Georgia", color: COLORS_PRO.gold,
      });
      slide3.addText(data.highlight.reason, {
        x: 1.5, y: 4.15, w: 7, h: 0.8,
        fontSize: 16, fontFace: "Arial", italic: true, color: COLORS_PRO.darkSecondary,
        align: "center", valign: "middle",
      });
      slide3.addText("\u201D", {
        x: 8.3, y: 4.55, w: 0.5, h: 0.5,
        fontSize: 40, fontFace: "Georgia", color: COLORS_PRO.gold,
      });

      slide3.addNotes(
        "🌟 MOMENTO DE RECONHECIMENTO (5 minutos)\n\n" +
        "═══════════════════════════════════════\n" +
        "👤 COLABORADOR EM DESTAQUE:\n" +
        "═══════════════════════════════════════\n\n" +
        `• Nome: ${data.highlight.name}\n` +
        `• Motivo: ${data.highlight.reason}\n\n` +
        "═══════════════════════════════════════\n" +
        "📋 ROTEIRO SUGERIDO:\n" +
        "═══════════════════════════════════════\n\n" +
        "1️⃣ PREPARAÇÃO (30 seg)\n" +
        "   • \"Agora chegou o momento mais especial da nossa reunião\"\n" +
        "   • \"Vamos reconhecer quem se destacou neste mês\"\n\n" +
        "2️⃣ REVELAÇÃO (1 min)\n" +
        "   • Crie suspense: \"E o destaque do mês é...\"\n" +
        `   • Anuncie: \"${data.highlight.name}!\"\n` +
        "   • Peça aplausos da equipe\n\n" +
        "3️⃣ RECONHECIMENTO (2 min)\n" +
        "   • Chame a pessoa à frente\n" +
        `   • Explique o motivo: \"${data.highlight.reason}\"\n` +
        "   • Destaque comportamentos específicos\n\n" +
        "4️⃣ CELEBRAÇÃO (1 min)\n" +
        "   • Entregue certificado ou brinde (se houver)\n" +
        "   • Tire foto para registro\n" +
        "   • Palmas finais\n\n" +
        "💡 DICA: Faça com que a pessoa se sinta verdadeiramente especial!"
      );

      // ============================================
      // SLIDE 4: MOMENTO MOTIVACIONAL - CINEMA MODE
      // ============================================
      const slide4 = pptx.addSlide();
      
      // Cinema-dark background
      slide4.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { type: "solid", color: COLORS_PRO.darkPrimary },
      });
      
      // Ambient glow effect
      slide4.addShape(pptx.ShapeType.ellipse, {
        x: 2, y: 0.5, w: 6, h: 4,
        fill: { type: "solid", color: COLORS_PRO.darkSecondary },
      });

      // Title with clapboard style
      slide4.addText("🎬 MOMENTO MOTIVACIONAL", {
        x: 0.5, y: 0.3, w: 9, h: 0.5,
        fontSize: 24, fontFace: "Arial", bold: true, color: COLORS_PRO.white,
        align: "center",
      });

      if (data.video) {
        // Extract YouTube ID for thumbnail and embed
        const videoId = data.video.youtubeId || (() => {
          const match = data.video.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?\s]+)/);
          return match ? match[1] : null;
        })();
        
        const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : data.video.url;
        const thumbnailUrl = videoId ? generateThumbnailUrl(videoId, 'maxresdefault') : null;

        // Video title in cinema font style
        slide4.addText(data.video.title, {
          x: 0.5, y: 0.9, w: 9, h: 0.4,
          fontSize: 16, fontFace: "Arial", bold: true, color: COLORS_PRO.accent,
          align: "center",
        });

        // Premium video frame with shadow (Netflix/YouTube Premium style)
        slide4.addShape(pptx.ShapeType.roundRect, {
          x: 1.5, y: 1.4, w: 7, h: 3.5,
          fill: { type: "solid", color: COLORS_PRO.black },
          line: { color: COLORS_PRO.darkTertiary, width: 3 },
          rectRadius: 0.15,
          shadow: { type: "outer", blur: 12, offset: 6, angle: 45, opacity: 0.5 },
        });

        // Try to add native YouTube embed (works on Office 365/2016+)
        try {
          slide4.addMedia({
            type: "online",
            link: embedUrl,
            x: 1.7, y: 1.6, w: 6.6, h: 3.1,
          });
        } catch {
          // Fallback: Add thumbnail image if embed fails
          if (thumbnailUrl) {
            slide4.addImage({
              path: thumbnailUrl,
              x: 1.7, y: 1.6, w: 6.6, h: 3.1,
              hyperlink: { url: data.video.url, tooltip: "Clique para assistir no YouTube" },
            });
          } else {
            // Fallback: Dark placeholder with play button
            slide4.addShape(pptx.ShapeType.rect, {
              x: 1.7, y: 1.6, w: 6.6, h: 3.1,
              fill: { type: "solid", color: COLORS_PRO.darkSecondary },
            });
          }
          
          // Play button overlay
          slide4.addShape(pptx.ShapeType.roundRect, {
            x: 4.3, y: 2.75, w: 1.4, h: 0.9,
            fill: { type: "solid", color: "FF0000" },
            rectRadius: 0.1,
            hyperlink: { url: data.video.url, tooltip: "Clique para assistir" },
          });
          slide4.addText("▶", {
            x: 4.3, y: 2.75, w: 1.4, h: 0.9,
            fontSize: 28, color: COLORS_PRO.white, align: "center", valign: "middle",
          });
        }

        // Clickable button to open video in browser (always works)
        slide4.addShape(pptx.ShapeType.roundRect, {
          x: 3, y: 5.05, w: 4, h: 0.45,
          fill: { type: "solid", color: "FF0000" },
          rectRadius: 0.1,
          shadow: { type: "outer", blur: 4, offset: 2, angle: 45, opacity: 0.3 },
          hyperlink: { url: data.video.url, tooltip: "Abrir vídeo no YouTube" },
        });
        slide4.addText("▶  ASSISTIR NO YOUTUBE", {
          x: 3, y: 5.05, w: 4, h: 0.45,
          fontSize: 12, fontFace: "Arial", bold: true, color: COLORS_PRO.white,
          align: "center", valign: "middle",
          hyperlink: { url: data.video.url, tooltip: "Abrir vídeo no YouTube" },
        });

        // Instruction text
        slide4.addText("Clique no botão acima ou pressione F5 para modo apresentação", {
          x: 0.5, y: 5.55, w: 9, h: 0.2,
          fontSize: 9, fontFace: "Arial", italic: true, color: COLORS_PRO.muted,
          align: "center",
        });
      } else {
        // No video selected state
        slide4.addShape(pptx.ShapeType.roundRect, {
          x: 2, y: 2, w: 6, h: 2,
          fill: { type: "solid", color: COLORS_PRO.darkSecondary },
          line: { color: COLORS_PRO.darkTertiary, width: 2, dashType: "dash" },
          rectRadius: 0.15,
        });
        slide4.addText("📹 Nenhum vídeo selecionado\n\nEscolha um vídeo motivacional para este momento.", {
          x: 2, y: 2, w: 6, h: 2,
          fontSize: 14, fontFace: "Arial", color: COLORS_PRO.muted,
          align: "center", valign: "middle",
        });
      }

      slide4.addNotes(
        "🎬 MOMENTO MOTIVACIONAL (10 minutos)\n\n" +
        "═══════════════════════════════════════\n" +
        "📹 VÍDEO SELECIONADO:\n" +
        "═══════════════════════════════════════\n\n" +
        (data.video 
          ? `• Título: ${data.video.title}\n• URL: ${data.video.url}\n\n` +
            "⚠️ COMO REPRODUZIR O VÍDEO:\n" +
            "   1. Clique no botão vermelho \"ASSISTIR NO YOUTUBE\"\n" +
            "   2. O vídeo abrirá no navegador\n" +
            "   3. Em PowerPoint 365, o vídeo pode tocar diretamente\n\n"
          : "• Nenhum vídeo selecionado\n\n"
        ) +
        "═══════════════════════════════════════\n" +
        "📋 ROTEIRO SUGERIDO:\n" +
        "═══════════════════════════════════════\n\n" +
        "1️⃣ INTRODUÇÃO (1 min)\n" +
        "   • Conecte o vídeo ao tema do mês\n" +
        "   • \"Quero que prestem atenção em uma mensagem especial\"\n" +
        "   • Peça silêncio e atenção plena\n\n" +
        "2️⃣ EXIBIÇÃO (3-5 min)\n" +
        "   • Reproduza o vídeo\n" +
        "   • Observe as reações da equipe\n\n" +
        "3️⃣ REFLEXÃO (4 min)\n" +
        "   • \"O que mais chamou a atenção de vocês?\"\n" +
        "   • \"Como podemos aplicar isso no nosso dia a dia?\"\n" +
        "   • Anote os insights compartilhados\n\n" +
        "4️⃣ CONEXÃO (1 min)\n" +
        "   • Relacione com os desafios do time\n" +
        "   • Encerre com uma frase de impacto\n\n" +
        "💡 DICA: Teste o vídeo antes da reunião!"
      );

      // ============================================
      // SLIDE 5: METAS E ESTRATÉGIAS - WAR ROOM
      // ============================================
      const slide5 = pptx.addSlide();
      
      // Professional clean background
      slide5.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { type: "solid", color: COLORS_PRO.lightPrimary },
      });
      
      // Header bar
      slide5.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: 0.08,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });

      // Title
      slide5.addText("🎯 METAS E ESTRATÉGIAS", {
        x: 0.5, y: 0.25, w: 9, h: 0.5,
        fontSize: 28, fontFace: "Arial", bold: true, color: COLORS_PRO.darkPrimary,
      });
      slide5.addText(`PRÓXIMO MÊS: ${MONTHS[data.month % 12].toUpperCase()}`, {
        x: 0.5, y: 0.65, w: 9, h: 0.25,
        fontSize: 11, fontFace: "Arial", color: COLORS_PRO.muted, charSpacing: 2,
      });

      // Large goal showcase (left side)
      slide5.addShape(pptx.ShapeType.roundRect, {
        x: 0.3, y: 1.1, w: 4.5, h: 2.2,
        fill: { type: "solid", color: COLORS_PRO.gold },
        rectRadius: 0.15,
        shadow: { type: "outer", blur: 6, offset: 3, angle: 45, opacity: 0.25 },
      });
      slide5.addText("META DO PRÓXIMO MÊS", {
        x: 0.3, y: 1.25, w: 4.5, h: 0.35,
        fontSize: 12, fontFace: "Arial", color: COLORS_PRO.white,
        align: "center", charSpacing: 1,
      });
      slide5.addText(formatCurrency(data.goal), {
        x: 0.3, y: 1.65, w: 4.5, h: 0.9,
        fontSize: 40, fontFace: "Arial Black", bold: true, color: COLORS_PRO.white,
        align: "center", valign: "middle",
      });
      // Weekly breakdown
      const weeklyGoal = data.goal / 4;
      slide5.addShape(pptx.ShapeType.rect, {
        x: 1.3, y: 2.6, w: 2.5, h: 0.03,
        fill: { type: "solid", color: COLORS_PRO.white },
      });
      slide5.addText(`≈ ${formatCurrency(weeklyGoal)} / semana`, {
        x: 0.3, y: 2.75, w: 4.5, h: 0.35,
        fontSize: 13, fontFace: "Arial", color: COLORS_PRO.white,
        align: "center",
      });

      // Weekly mini-cards (below goal)
      const weekLabels = ["S1", "S2", "S3", "S4"];
      let weekX = 0.6;
      weekLabels.forEach((label, idx) => {
        slide5.addShape(pptx.ShapeType.roundRect, {
          x: weekX, y: 3.45, w: 0.95, h: 0.55,
          fill: { type: "solid", color: COLORS_PRO.white },
          rectRadius: 0.05,
        });
        slide5.addText(label, {
          x: weekX, y: 3.48, w: 0.95, h: 0.25,
          fontSize: 9, fontFace: "Arial", bold: true, color: COLORS_PRO.gold,
          align: "center",
        });
        slide5.addText(formatCurrencyCompact(weeklyGoal), {
          x: weekX, y: 3.7, w: 0.95, h: 0.25,
          fontSize: 8, fontFace: "Arial", color: COLORS_PRO.darkSecondary,
          align: "center",
        });
        weekX += 1.05;
      });

      // Strategies section (right side)
      slide5.addText("📋 ESTRATÉGIAS DO MÊS", {
        x: 5, y: 1.1, w: 4.7, h: 0.35,
        fontSize: 14, fontFace: "Arial", bold: true, color: COLORS_PRO.darkPrimary,
      });

      let stratY = 1.55;
      const maxStrategies = Math.min(data.strategies.length, 5);
      
      for (let i = 0; i < maxStrategies; i++) {
        const strategy = data.strategies[i];
        
        // Strategy card
        slide5.addShape(pptx.ShapeType.roundRect, {
          x: 5, y: stratY, w: 4.7, h: 0.55,
          fill: { type: "solid", color: COLORS_PRO.white },
          rectRadius: 0.08,
          shadow: { type: "outer", blur: 2, offset: 1, angle: 45, opacity: 0.08 },
        });
        
        // Number badge
        slide5.addShape(pptx.ShapeType.ellipse, {
          x: 5.1, y: stratY + 0.1, w: 0.35, h: 0.35,
          fill: { type: "solid", color: COLORS_PRO.primary },
        });
        slide5.addText(`${i + 1}`, {
          x: 5.1, y: stratY + 0.1, w: 0.35, h: 0.35,
          fontSize: 10, fontFace: "Arial", bold: true, color: COLORS_PRO.white,
          align: "center", valign: "middle",
        });
        
        // Strategy text
        slide5.addText(strategy.length > 45 ? strategy.substring(0, 45) + "..." : strategy, {
          x: 5.55, y: stratY, w: 4, h: 0.55,
          fontSize: 10, fontFace: "Arial", color: COLORS_PRO.darkSecondary,
          valign: "middle",
        });
        
        stratY += 0.62;
      }

      if (data.strategies.length === 0) {
        slide5.addText("Nenhuma estratégia definida", {
          x: 5, y: 1.6, w: 4.7, h: 0.5,
          fontSize: 11, fontFace: "Arial", italic: true, color: COLORS_PRO.muted,
        });
      }

      // "Histórico + 15%" badge
      slide5.addShape(pptx.ShapeType.roundRect, {
        x: 0.3, y: 4.15, w: 4.5, h: 0.35,
        fill: { type: "solid", color: COLORS_PRO.successLight },
        rectRadius: 0.05,
      });
      slide5.addText("📈 Cálculo: Histórico + 15% de crescimento", {
        x: 0.3, y: 4.15, w: 4.5, h: 0.35,
        fontSize: 9, fontFace: "Arial", color: COLORS_PRO.successDark,
        align: "center", valign: "middle",
      });

      // Footer
      slide5.addShape(pptx.ShapeType.rect, {
        x: 0, y: 5.5, w: "100%", h: 0.08,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });

      slide5.addNotes(
        "🎯 METAS E ESTRATÉGIAS (10 minutos)\n\n" +
        "═══════════════════════════════════════\n" +
        "📊 DADOS DA META:\n" +
        "═══════════════════════════════════════\n\n" +
        `• Meta mensal: ${formatCurrency(data.goal)}\n` +
        `• Meta semanal: ${formatCurrency(weeklyGoal)}\n` +
        `• Meta diária (22 dias): ${formatCurrency(data.goal / 22)}\n\n` +
        "═══════════════════════════════════════\n" +
        "📋 ESTRATÉGIAS DEFINIDAS:\n" +
        "═══════════════════════════════════════\n" +
        data.strategies.map((s, i) => `${i + 1}. ${s}`).join("\n") +
        "\n\n═══════════════════════════════════════\n" +
        "📋 ROTEIRO SUGERIDO:\n" +
        "═══════════════════════════════════════\n\n" +
        "1️⃣ APRESENTAÇÃO DA META (3 min)\n" +
        `   • \"Nossa meta para ${MONTHS[data.month % 12]} é ${formatCurrency(data.goal)}\"\n` +
        "   • Explique a lógica do cálculo\n" +
        "   • Divida em metas semanais\n\n" +
        "2️⃣ ESTRATÉGIAS (5 min)\n" +
        "   • Apresente cada estratégia\n" +
        "   • Defina responsáveis\n" +
        "   • Estabeleça prazos\n\n" +
        "3️⃣ COMPROMETIMENTO (2 min)\n" +
        "   • \"Quem topa esse desafio?\"\n" +
        "   • Peça comprometimento público\n" +
        "   • Defina checkpoints semanais\n\n" +
        "💡 DICA: Transforme a meta em algo tangível e alcançável!"
      );

      // ============================================
      // SLIDE 6: ENCERRAMENTO ÉPICO
      // ============================================
      const slide6 = pptx.addSlide();
      
      // Epic dark gradient background
      slide6.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: "100%", h: "100%",
        fill: { type: "solid", color: COLORS_PRO.darkPrimary },
      });
      
      // Organic colored shapes (confetti-like decoration)
      slide6.addShape(pptx.ShapeType.ellipse, {
        x: -1, y: -0.5, w: 3.5, h: 3.5,
        fill: { type: "solid", color: COLORS_PRO.secondary },
      });
      slide6.addShape(pptx.ShapeType.ellipse, {
        x: 7.5, y: 3.5, w: 3, h: 3,
        fill: { type: "solid", color: COLORS_PRO.primary },
      });
      slide6.addShape(pptx.ShapeType.ellipse, {
        x: 8, y: -0.5, w: 2, h: 2,
        fill: { type: "solid", color: COLORS_PRO.gold },
      });
      slide6.addShape(pptx.ShapeType.ellipse, {
        x: -0.5, y: 4, w: 2, h: 2,
        fill: { type: "solid", color: COLORS_PRO.accent },
      });

      // Small star particles
      const starPositions = [
        { x: 1, y: 1 }, { x: 2.5, y: 0.5 }, { x: 7, y: 1.5 },
        { x: 8.5, y: 3 }, { x: 1.5, y: 4.5 }, { x: 6, y: 4.8 },
      ];
      starPositions.forEach(pos => {
        slide6.addShape(pptx.ShapeType.star5, {
          x: pos.x, y: pos.y, w: 0.25, h: 0.25,
          fill: { type: "solid", color: COLORS_PRO.gold },
        });
      });

      // Main impact phrase
      slide6.addText("JUNTOS,", {
        x: 0.5, y: 1.3, w: 9, h: 0.8,
        fontSize: 52, fontFace: "Arial Black", bold: true, color: COLORS_PRO.white,
        align: "center",
      });
      slide6.addText("VAMOS CONQUISTAR!", {
        x: 0.5, y: 2, w: 9, h: 0.8,
        fontSize: 44, fontFace: "Arial Black", bold: true, color: COLORS_PRO.gold,
        align: "center",
      });

      // Goal highlight box
      slide6.addShape(pptx.ShapeType.roundRect, {
        x: 2.5, y: 3, w: 5, h: 0.9,
        fill: { type: "solid", color: COLORS_PRO.white },
        rectRadius: 0.1,
        shadow: { type: "outer", blur: 6, offset: 3, angle: 45, opacity: 0.3 },
      });
      slide6.addText(formatCurrency(data.goal), {
        x: 2.5, y: 3, w: 5, h: 0.9,
        fontSize: 36, fontFace: "Arial", bold: true, color: COLORS_PRO.gold,
        align: "center", valign: "middle",
      });

      // Theme callback
      if (data.theme) {
        slide6.addText(`"${data.theme}"`, {
          x: 0.5, y: 4.1, w: 9, h: 0.5,
          fontSize: 16, fontFace: "Arial", italic: true, color: COLORS_PRO.lightTertiary,
          align: "center",
        });
      }

      // Company name (prominent)
      if (data.companyName) {
        slide6.addText(data.companyName.toUpperCase(), {
          x: 0.5, y: 4.7, w: 9, h: 0.4,
          fontSize: 14, fontFace: "Arial", bold: true, color: COLORS_PRO.white,
          align: "center", charSpacing: 3,
        });
      }

      // "Powered by IRIS" subtle seal
      slide6.addShape(pptx.ShapeType.roundRect, {
        x: 3.8, y: 5.15, w: 2.4, h: 0.3,
        fill: { type: "solid", color: COLORS_PRO.darkTertiary },
        rectRadius: 0.05,
      });
      slide6.addText("✨ Powered by IRIS", {
        x: 3.8, y: 5.15, w: 2.4, h: 0.3,
        fontSize: 8, fontFace: "Arial", color: COLORS_PRO.mutedLight,
        align: "center", valign: "middle",
      });

      slide6.addNotes(
        "🚀 ENCERRAMENTO ÉPICO (5 minutos)\n\n" +
        "═══════════════════════════════════════\n" +
        "📋 ROTEIRO SUGERIDO:\n" +
        "═══════════════════════════════════════\n\n" +
        "1️⃣ RECAPITULAÇÃO (1 min)\n" +
        "   • Destaque os pontos principais da reunião\n" +
        "   • Celebre novamente o destaque do mês\n" +
        "   • Reforce as principais estratégias\n\n" +
        "2️⃣ META FINAL (1 min)\n" +
        `   • \"Nossa missão para ${MONTHS[data.month % 12]}: ${formatCurrency(data.goal)}\"\n` +
        "   • Olhe nos olhos de cada um\n" +
        "   • Transmita confiança\n\n" +
        "3️⃣ GRITO DE GUERRA (2 min)\n" +
        "   • \"Quem está comigo?\"\n" +
        "   • Levante a equipe\n" +
        "   • Crie um momento de união\n\n" +
        "4️⃣ ENCERRAMENTO (1 min)\n" +
        `   • Repita o tema: \"${data.theme}\"\n` +
        "   • Palmas e celebração\n" +
        "   • \"Vamos com tudo!\"\n\n" +
        "═══════════════════════════════════════\n" +
        "💡 DICA FINAL:\n" +
        "   Termine com ENERGIA ALTA! A última impressão\n" +
        "   é a que fica. Deixe o time motivado para\n" +
        "   conquistar o próximo mês!\n" +
        "═══════════════════════════════════════"
      );

      // Generate and download file
      const fileName = `RMR_${MONTHS[data.month - 1]}_${data.year}_Premium.pptx`;
      await pptx.writeFile({ fileName });
      
      toast.success("Apresentação Premium gerada!", {
        description: `${fileName} foi baixado com sucesso.`,
      });
      
      return true;
    } catch (error) {
      console.error("Error generating slides:", error);
      toast.error("Erro ao gerar apresentação", {
        description: "Tente novamente ou entre em contato com o suporte.",
      });
      return false;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateSlides,
    isGenerating,
  };
}
