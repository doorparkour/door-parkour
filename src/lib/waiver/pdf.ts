import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const MARGIN = 50;
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const FONT_SIZE = 11;
const LINE_HEIGHT = 14;

export async function generateWaiverPdf(
  title: string,
  content: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  function checkNewPage(neededHeight: number) {
    if (y - neededHeight < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  }

  function drawLine(text: string, opts?: { bold?: boolean }) {
    const f = opts?.bold ? fontBold : font;
    const lines = wrapText(text, CONTENT_WIDTH, (t) => f.widthOfTextAtSize(t, FONT_SIZE));
    for (const line of lines) {
      checkNewPage(LINE_HEIGHT);
      page.drawText(line, {
        x: MARGIN,
        y,
        size: FONT_SIZE,
        font: f,
        color: rgb(0, 0, 0),
      });
      y -= LINE_HEIGHT;
    }
  }

  function drawBlankLine() {
    checkNewPage(LINE_HEIGHT);
    y -= LINE_HEIGHT;
  }

  // Title
  drawLine(title, { bold: true });
  drawBlankLine();

  // Content - line by line
  const lines = content.split("\n");
  for (const line of lines) {
    if (line.trim() === "") {
      drawBlankLine();
    } else {
      drawLine(line);
    }
  }

  return doc.save();
}

function wrapText(
  text: string,
  maxWidth: number,
  measure: (t: string) => number
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measure(candidate) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
