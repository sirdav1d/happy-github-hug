import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Clock, FileText, Loader2, ChevronDown, ChevronUp, Presentation } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useRMRSlides } from "@/hooks/useRMRSlides";
import { Salesperson } from "@/types";

interface RMRScriptPreviewProps {
  scriptMarkdown: string;
  month: number;
  year: number;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
  // Data for slide generation
  slideData?: {
    theme: string;
    highlight: { name: string; reason: string };
    previousMonth: { revenue: number; goal: number };
    goal: number;
    strategies: string[];
    video?: { title: string; url: string; youtubeId?: string };
    team: { id: string; name: string; revenue: number; goal: number }[];
    companyName?: string;
  };
}

const SECTION_COLORS: Record<string, string> = {
  "Abertura": "bg-amber-500",
  "Resultados": "bg-blue-500",
  "Reconhecimento": "bg-violet-500",
  "Motivacional": "bg-pink-500",
  "Metas": "bg-emerald-500",
  "Encerramento": "bg-primary"
};

const SECTION_DURATIONS: Record<string, number> = {
  "Abertura": 5,
  "Resultados": 10,
  "Reconhecimento": 5,
  "Motivacional": 10,
  "Metas": 10,
  "Encerramento": 5
};

const RMRScriptPreview = ({ 
  scriptMarkdown, 
  month, 
  year, 
  onClose, 
  onDownload,
  isDownloading,
  slideData
}: RMRScriptPreviewProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["Abertura"]));
  const { generateSlides, isGenerating: isGeneratingSlides } = useRMRSlides();

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Parse sections from markdown
  const parseSections = (markdown: string) => {
    const sections: { title: string; content: string; duration: number }[] = [];
    if (!markdown?.trim()) return sections;

    // Robust section parser:
    // - Accepts headings like "## Abertura", "##1. Abertura", "## 1. Abertura"
    // - Captures content until the next "##" heading
    const headingRegex = /^##\s*\d*\.?\s*(.+)$/gm;

    const matches = Array.from(markdown.matchAll(headingRegex));
    if (matches.length === 0) return sections;

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const rawTitle = (match[1] ?? "").replace(/\*\*/g, "").trim();
      const start = (match.index ?? 0) + match[0].length;
      const end = i + 1 < matches.length ? (matches[i + 1].index ?? markdown.length) : markdown.length;
      const content = markdown.slice(start, end).trim();

      const sectionKey = Object.keys(SECTION_DURATIONS).find((key) =>
        rawTitle.toLowerCase().includes(key.toLowerCase())
      );

      sections.push({
        title: rawTitle,
        content,
        duration: sectionKey ? SECTION_DURATIONS[sectionKey] : 5,
      });
    }

    return sections;
  };

  const sections = parseSections(scriptMarkdown);

  const toggleSection = (title: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(title)) {
        newSet.delete(title);
      } else {
        newSet.add(title);
      }
      return newSet;
    });
  };

  const getSectionColor = (title: string) => {
    const key = Object.keys(SECTION_COLORS).find(k => 
      title.toLowerCase().includes(k.toLowerCase())
    );
    return key ? SECTION_COLORS[key] : "bg-muted";
  };

  // Render markdown content with basic formatting
  const renderContent = (content: string) => {
    const lines = content.split("\n");

    return lines.map((line, idx) => {
      const trimmed = line.trim();

      if (!trimmed) return <div key={idx} className="h-2" />;

      if (trimmed.startsWith("# ")) {
        return (
          <h3 key={idx} className="text-base font-semibold text-foreground mt-3 mb-2">
            {trimmed.replace(/^#\s+/, "").replace(/\*\*/g, "")}
          </h3>
        );
      }

      if (trimmed.startsWith("##")) {
        return (
          <h4 key={idx} className="font-semibold text-foreground mt-3 mb-2">
            {trimmed.replace(/^##\s*/, "").replace(/^\d*\.?\s*/, "").replace(/\*\*/g, "")}
          </h4>
        );
      }

      if (trimmed.startsWith("### ")) {
        return (
          <h5 key={idx} className="font-semibold text-foreground mt-3 mb-2">
            {trimmed.replace("### ", "").replace(/\*\*/g, "")}
          </h5>
        );
      }

      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2">
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-foreground">
              {trimmed.replace(/^[-*]\s/, "").replace(/\*\*/g, "")}
            </span>
          </div>
        );
      }

      if (trimmed.startsWith(">") || trimmed.startsWith('"')) {
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-amber-500 pl-3 my-2 italic text-muted-foreground"
          >
            {trimmed.replace(/^>\s*/, "").replace(/"/g, "")}
          </blockquote>
        );
      }

      // Bold text
      const boldedLine = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

      return (
        <p
          key={idx}
          className="text-sm text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: boldedLine }}
        />
      );
    });
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="rmr-script-preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          key="rmr-script-preview-modal"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <FileText className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Roteiro RMR - {monthNames[month - 1]} {year}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Duração total: 45 minutos</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDownload}
                    disabled={isDownloading}
                  >
                    {isDownloading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </>
                    )}
                  </Button>
                  {slideData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generateSlides({ ...slideData, month, year })}
                      disabled={isGeneratingSlides}
                      className="bg-violet-500/10 border-violet-500/30 hover:bg-violet-500/20 text-violet-700 dark:text-violet-300"
                    >
                      {isGeneratingSlides ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Presentation className="h-4 w-4 mr-2" />
                          Slides
                        </>
                      )}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Timeline Bar */}
              {sections.length > 0 && (
                <>
                  <div className="flex gap-0.5 mt-4 rounded-full overflow-hidden h-2">
                    {sections.map((section, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "transition-all",
                          getSectionColor(section.title)
                        )}
                        style={{ flex: section.duration }}
                        title={`${section.title} (${section.duration} min)`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0 min</span>
                    <span>15 min</span>
                    <span>30 min</span>
                    <span>45 min</span>
                  </div>
                </>
              )}
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-[calc(90vh-200px)]">
                <div className="p-4 space-y-2">
                  {sections.length > 0 ? (
                    sections.map((section, idx) => (
                      <div
                        key={idx}
                        className="border border-border rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => toggleSection(section.title)}
                          className={cn(
                            "w-full flex items-center justify-between p-3",
                            "hover:bg-secondary/50 transition-colors",
                            expandedSections.has(section.title) && "bg-secondary/30"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                "w-1 h-8 rounded-full",
                                getSectionColor(section.title)
                              )}
                            />
                            <div className="text-left">
                              <p className="font-medium text-foreground">{section.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {section.duration} min
                            </Badge>
                            {expandedSections.has(section.title) ? (
                              <ChevronUp className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </button>

                        <AnimatePresence mode="wait">
                          {expandedSections.has(section.title) && (
                            <motion.div
                              key={`section-content-${idx}`}
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-2 border-t border-border bg-secondary/10">
                                {renderContent(section.content)}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  ) : scriptMarkdown?.trim() ? (
                    <Card className="p-4 bg-secondary/10 border-border">
                      <div className="prose prose-sm max-w-none space-y-2">
                        {renderContent(scriptMarkdown)}
                      </div>
                    </Card>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum conteúdo encontrado no roteiro</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RMRScriptPreview;
