import { ProjectData } from '../types';
import { BASE_STYLE_BLOCK, STYLE_REGISTERS, COCA_COLA_CAN_SPECS } from '../data/protocolsData';

/**
 * Downloads a string content as a file directly in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Estimates token count for typical LLMs (approx 3.8 to 4 characters per token).
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Word count + punctuation heuristic for cl100k / gemini tokenizer
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  return Math.round((chars / 4.0 + words * 0.75) / 2);
}

/**
 * Builds the full word-for-word prompt string for the 5x3 Storyboard sheet.
 */
export function compileStoryboardPrompt(project: ProjectData): string {
  const sb = project.storyboard;
  const activeRegister = STYLE_REGISTERS.find(r => r.id === sb.selectedRegister) || STYLE_REGISTERS[1];

  return `STORYBOARD SHEET 5x3 PROTOCOL (v2.0 Claude Code Edition)
FORMAT: 5x3 GRID · 15 PANELS · 15 SECONDS RUNTIME (1s / panel)
HEADER: [${(sb.titleWord || 'FORGED').toUpperCase()}] · [${(sb.formatLabel || '15 SEC').toUpperCase()}]
SUBJECT: ${sb.subject}
COLOURWAY: ${sb.colourway}
ASPECT RATIO: ${sb.aspectRatio}

${BASE_STYLE_BLOCK}

${activeRegister.lockedContent}

LOCKED FORMAT & CHROME RULES:
- Exactly 15 panels arranged in a 5 across by 3 down grid (5x3).
- Read strictly left-to-right, top-to-bottom (Panel 1 opens at 00:00, Panel 15 closes at 00:15).
- Every panel carries visible chrome: panel number (1-15), precise timecode, and a single-line caption under the panel.
- Header block displays "${(sb.titleWord || 'FORGED').toUpperCase()}" on left and "${(sb.formatLabel || '15 SEC').toUpperCase()}" on right.
- Motion is present in every panel; no two consecutive panels share the exact same framing.
- Colourway and identity remain locked across all 15 panels.

15-PANEL SEQUENCE BREAKDOWN:
${sb.panels.map(p => `PANEL ${p.panelNumber.toString().padStart(2, '0')} [${p.timecode}] (${p.framing}): ${p.caption}`).join('\n')}

END OF SHEET SPECIFICATION.`;
}

/**
 * Generates an enriched Markdown export of the Storyboard Sheet with project metadata.
 */
export function generateStoryboardMarkdown(project: ProjectData): string {
  const prompt = compileStoryboardPrompt(project);
  const tokenEst = estimateTokens(prompt);

  return `# Storyboard Sheet 5×3 — ${project.name}

> **Project:** ${project.name} (${project.category.toUpperCase()})  
> **Updated:** ${new Date(project.updatedAt).toLocaleString()}  
> **Aspect Ratio:** ${project.storyboard.aspectRatio}  
> **Estimated Tokens:** ~${tokenEst}  

---

## 📋 Full Generation Prompt (Ready for Gemini / Midjourney / ChatGPT)

\`\`\`text
${prompt}
\`\`\`

---

## 🎬 15-Panel Breakdown Table

| Panel | Timecode | Framing | Caption / Action | Visual Note |
| :---: | :---: | :--- | :--- | :--- |
${project.storyboard.panels.map(p => `| **${p.panelNumber.toString().padStart(2, '0')}** | \`${p.timecode}\` | *${p.framing}* | ${p.caption} | ${p.visualNote} |`).join('\n')}

---
*Exported from Storyboard Animation Engine · Claude Code & OAK Studio Edition*
`;
}

/**
 * Generates Scale 2x2 Markdown export.
 */
export function generateScaleMarkdown(project: ProjectData): string {
  const sc = project.scaleCalculator;
  const numHeight = typeof sc.verifiedHeight === 'number' ? sc.verifiedHeight : 0;
  const ratio = numHeight > 0 ? (numHeight / COCA_COLA_CAN_SPECS.heightCm).toFixed(2) : '—';

  return `# Scale 2×2 Protocol — ${sc.subjectName || project.name}

> Reference Can: Standard 33cl Coca-Cola Classic (11.5cm Height × 6.6cm Body Diameter)  
> Ratio: ${ratio}x relative to reference can  

\`\`\`text
SUBJECT DIMENSIONS:
Subject: ${sc.subjectName}
Verified height: ${numHeight > 0 ? `${numHeight} cm` : '[pending]'}
Verified length: ${sc.verifiedLength ? `${sc.verifiedLength} cm` : 'N/A'}
Verified width: ${sc.verifiedWidth ? `${sc.verifiedWidth} cm` : 'N/A'}
Additional measurements: ${sc.additionalNotes || 'Standard tolerances'}

SCALE CALCULATION:
Subject height = ${numHeight} cm ÷ 11.5 cm = ${ratio}x reference can height.
Views: 1. Front | 2. 3/4 | 3. Side | 4. Rear 3/4
\`\`\`
`;
}
