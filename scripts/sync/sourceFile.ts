import fs from 'fs';

/** All offsets refer to the original source, including insertions. */
export function applyTextEdits(source: string, edits: Array<{ start: number; end: number; text: string }>): string {
  let boundary = source.length;
  for (const { start, end, text } of [...edits].sort((a, b) => b.start - a.start || b.end - a.end)) {
    if (start < 0 || end < start || end > boundary) throw new Error('Invalid or overlapping generated type edits.');
    source = source.slice(0, start) + text + source.slice(end);
    boundary = start;
  }
  return source;
}

/** Writes `content` using whatever line endings the file already had, so a sync never churns them. */
export function writePreservingEol(filePath: string, content: string, original: string): void {
  const eol = original.includes('\r\n') ? '\r\n' : '\n';
  fs.writeFileSync(filePath, content.replace(/\r\n/g, '\n').replace(/\n/g, eol), 'utf-8');
}
