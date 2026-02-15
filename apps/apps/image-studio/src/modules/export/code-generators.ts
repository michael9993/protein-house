import type * as fabric from "fabric";

/**
 * Export canvas objects as HTML with inline CSS.
 */
export function canvasToHtmlCss(canvas: fabric.Canvas): string {
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const bg = canvas.backgroundColor ?? "#ffffff";
  const objects = canvas.getObjects();

  let html = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Image Studio Export</title>\n</head>\n<body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0;">\n`;
  html += `<div style="position: relative; width: ${w}px; height: ${h}px; background: ${bg}; overflow: hidden;">\n`;

  for (const obj of objects) {
    html += objectToHtml(obj);
  }

  html += `</div>\n</body>\n</html>`;
  return html;
}

/**
 * Export canvas objects as a React component with Tailwind CSS.
 */
export function canvasToReactTailwind(canvas: fabric.Canvas): string {
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const bg = canvas.backgroundColor ?? "#ffffff";
  const objects = canvas.getObjects();

  let jsx = `export function Design() {\n  return (\n`;
  jsx += `    <div className="relative overflow-hidden" style={{ width: ${w}, height: ${h}, background: "${bg}" }}>\n`;

  for (const obj of objects) {
    jsx += objectToJsx(obj, 6);
  }

  jsx += `    </div>\n  );\n}\n`;
  return jsx;
}

/**
 * Export canvas as SVG using Fabric's built-in method.
 */
export function canvasToSvg(canvas: fabric.Canvas): string {
  return canvas.toSVG();
}

// ─── Helpers ────────────────────────────────────────────────

function objectToHtml(obj: fabric.FabricObject, indent = 2): string {
  const pad = " ".repeat(indent);
  const left = Math.round(obj.left ?? 0);
  const top = Math.round(obj.top ?? 0);
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  const opacity = obj.opacity ?? 1;
  const angle = obj.angle ?? 0;
  const o = obj as any;

  const baseStyle = `position: absolute; left: ${left}px; top: ${top}px;`;
  const opacityStyle = opacity < 1 ? ` opacity: ${opacity};` : "";
  const rotateStyle = angle ? ` transform: rotate(${angle}deg);` : "";

  switch (obj.type) {
    case "rect": {
      const w = Math.round((obj.width ?? 0) * scaleX);
      const h = Math.round((obj.height ?? 0) * scaleY);
      const fill = typeof obj.fill === "string" ? obj.fill : "#cccccc";
      const rx = o.rx ? ` border-radius: ${o.rx}px;` : "";
      return `${pad}<div style="${baseStyle} width: ${w}px; height: ${h}px; background: ${fill};${rx}${opacityStyle}${rotateStyle}"></div>\n`;
    }
    case "circle": {
      const r = (o.radius ?? 50) * scaleX;
      const d = Math.round(r * 2);
      const fill = typeof obj.fill === "string" ? obj.fill : "#cccccc";
      return `${pad}<div style="${baseStyle} width: ${d}px; height: ${d}px; border-radius: 50%; background: ${fill};${opacityStyle}${rotateStyle}"></div>\n`;
    }
    case "i-text":
    case "textbox": {
      const text = o.text ?? "";
      const fontSize = o.fontSize ?? 16;
      const fontFamily = o.fontFamily ?? "Arial";
      const fontWeight = o.fontWeight === "bold" ? " font-weight: bold;" : "";
      const fill = typeof obj.fill === "string" ? obj.fill : "#000000";
      const textAlign = o.textAlign ? ` text-align: ${o.textAlign};` : "";
      return `${pad}<p style="${baseStyle} font-size: ${fontSize}px; font-family: '${fontFamily}', sans-serif; color: ${fill};${fontWeight}${textAlign}${opacityStyle}${rotateStyle} margin: 0;">${escapeHtml(text)}</p>\n`;
    }
    case "image": {
      const w = Math.round((obj.width ?? 0) * scaleX);
      const h = Math.round((obj.height ?? 0) * scaleY);
      const src = o._element?.src ?? "";
      return `${pad}<img src="${escapeHtml(src)}" alt="" style="${baseStyle} width: ${w}px; height: ${h}px; object-fit: cover;${opacityStyle}${rotateStyle}" />\n`;
    }
    case "group": {
      const w = Math.round((obj.width ?? 0) * scaleX);
      const h = Math.round((obj.height ?? 0) * scaleY);
      let out = `${pad}<div style="${baseStyle} width: ${w}px; height: ${h}px;${opacityStyle}${rotateStyle}">\n`;
      const children = (obj as any)._objects ?? [];
      for (const child of children) {
        out += objectToHtml(child, indent + 2);
      }
      out += `${pad}</div>\n`;
      return out;
    }
    default:
      return `${pad}<!-- Unsupported: ${obj.type} -->\n`;
  }
}

function objectToJsx(obj: fabric.FabricObject, indent = 6): string {
  const pad = " ".repeat(indent);
  const left = Math.round(obj.left ?? 0);
  const top = Math.round(obj.top ?? 0);
  const scaleX = obj.scaleX ?? 1;
  const scaleY = obj.scaleY ?? 1;
  const opacity = obj.opacity ?? 1;
  const angle = obj.angle ?? 0;
  const o = obj as any;

  const styleObj: Record<string, string | number> = { left, top };
  if (opacity < 1) styleObj.opacity = opacity;
  if (angle) styleObj.transform = `rotate(${angle}deg)`;

  switch (obj.type) {
    case "rect": {
      const w = Math.round((obj.width ?? 0) * scaleX);
      const h = Math.round((obj.height ?? 0) * scaleY);
      const fill = typeof obj.fill === "string" ? obj.fill : "#cccccc";
      const rx = o.rx ? `, borderRadius: ${o.rx}` : "";
      return `${pad}<div className="absolute" style={{ ...${JSON.stringify({ ...styleObj, width: w, height: h, background: fill })}${rx ? ` ${rx}` : ""} }} />\n`;
    }
    case "circle": {
      const r = (o.radius ?? 50) * scaleX;
      const d = Math.round(r * 2);
      const fill = typeof obj.fill === "string" ? obj.fill : "#cccccc";
      return `${pad}<div className="absolute rounded-full" style={${JSON.stringify({ ...styleObj, width: d, height: d, background: fill })}} />\n`;
    }
    case "i-text":
    case "textbox": {
      const text = o.text ?? "";
      const fontSize = o.fontSize ?? 16;
      const fontFamily = o.fontFamily ?? "Arial";
      const fill = typeof obj.fill === "string" ? obj.fill : "#000000";
      const bold = o.fontWeight === "bold" ? " font-bold" : "";
      return `${pad}<p className="absolute${bold}" style={${JSON.stringify({ ...styleObj, fontSize, fontFamily: `'${fontFamily}', sans-serif`, color: fill })}}>${text}</p>\n`;
    }
    case "image": {
      const w = Math.round((obj.width ?? 0) * scaleX);
      const h = Math.round((obj.height ?? 0) * scaleY);
      const src = o._element?.src ?? "";
      return `${pad}<img src="${src}" alt="" className="absolute object-cover" style={${JSON.stringify({ ...styleObj, width: w, height: h })}} />\n`;
    }
    default:
      return `${pad}{/* Unsupported: ${obj.type} */}\n`;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
