'use strict';
const Jimp = require('jimp');
const path = require('path');

const OUT = path.join(__dirname, '..', 'assets');

// Club colors RGBA (0xRRGGBBAA)
const RED        = Jimp.rgbaToInt(0xC8, 0x10, 0x2E, 0xFF);
const BLUE       = Jimp.rgbaToInt(0x00, 0x30, 0x87, 0xFF);
const NAVY       = Jimp.rgbaToInt(0x00, 0x14, 0x50, 0xFF);
const WHITE      = Jimp.rgbaToInt(0xFF, 0xFF, 0xFF, 0xFF);
const TRANSPARENT = 0x00000000;
const LIGHT_RED  = Jimp.rgbaToInt(0xE8, 0x33, 0x4E, 0xFF);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pointInPolygon(px, py, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1];
    const xj = poly[j][0], yj = poly[j][1];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function fillPolygon(img, poly, color) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const x0 = Math.max(0, Math.floor(minX) - 1);
  const y0 = Math.max(0, Math.floor(minY) - 1);
  const x1 = Math.min(img.bitmap.width - 1, Math.ceil(maxX) + 1);
  const y1 = Math.min(img.bitmap.height - 1, Math.ceil(maxY) + 1);
  img.scan(x0, y0, x1 - x0, y1 - y0, function (x, y) {
    if (pointInPolygon(x + 0.5, y + 0.5, poly)) {
      this.setPixelColor(color, x, y);
    }
  });
}

function fillCircle(img, cx, cy, r, color) {
  const x0 = Math.max(0, Math.floor(cx - r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const x1 = Math.min(img.bitmap.width - 1, Math.ceil(cx + r));
  const y1 = Math.min(img.bitmap.height - 1, Math.ceil(cy + r));
  const r2 = r * r;
  img.scan(x0, y0, x1 - x0 + 1, y1 - y0 + 1, function (x, y) {
    if ((x - cx) ** 2 + (y - cy) ** 2 <= r2) {
      this.setPixelColor(color, x, y);
    }
  });
}

function drawStar(img, cx, cy, outerR, innerR, color) {
  const pts = [];
  for (let i = 0; i < 5; i++) {
    const oa = (i * 2 * Math.PI / 5) - Math.PI / 2;
    const ia = oa + Math.PI / 5;
    pts.push([cx + outerR * Math.cos(oa), cy + outerR * Math.sin(oa)]);
    pts.push([cx + innerR * Math.cos(ia), cy + innerR * Math.sin(ia)]);
  }
  fillPolygon(img, pts, color);
}

// Shield: 8-point polygon with pointed bottom
function drawShield(img, cx, cy, w, h, fillColor) {
  const l = cx - w / 2, r = cx + w / 2;
  const t = cy - h / 2;
  const bm = cy + h * 0.3;  // bottom-mid
  const bt = cy + h / 2;    // bottom tip
  const shield = [
    [l + w * 0.08, t],
    [r - w * 0.08, t],
    [r, t + h * 0.08],
    [r, bm],
    [cx + w * 0.28, bt - h * 0.05],
    [cx, bt],
    [cx - w * 0.28, bt - h * 0.05],
    [l, bm],
    [l, t + h * 0.08],
  ];
  fillPolygon(img, shield, fillColor);
}

// ─── Draw the full EDS logo onto an image at a given scale ───────────────────

function drawLogo(img, cx, cy, size) {
  const s = size;

  // 1. Outer shield border (navy)
  drawShield(img, cx, cy, s * 0.72, s * 0.83, NAVY);
  // 2. Shield body (white)
  drawShield(img, cx, cy, s * 0.67, s * 0.78, WHITE);

  // 3. Outer circle ring (navy)
  fillCircle(img, cx, cy - s * 0.01, s * 0.285, NAVY);
  // 4. White ring
  fillCircle(img, cx, cy - s * 0.01, s * 0.255, WHITE);
  // 5. Blue circle
  fillCircle(img, cx, cy - s * 0.01, s * 0.235, BLUE);

  // 6. Stars inside circle
  // Central big star
  drawStar(img, cx, cy - s * 0.01, s * 0.083, s * 0.032, WHITE);
  // 6 stars in a ring
  const ringR = s * 0.155;
  for (let i = 0; i < 6; i++) {
    const angle = (i * Math.PI / 3) - Math.PI / 2;
    const sx = cx + ringR * Math.cos(angle);
    const sy = (cy - s * 0.01) + ringR * Math.sin(angle);
    drawStar(img, sx, sy, s * 0.053, s * 0.021, WHITE);
  }

  // 7. Red top banner strip inside shield (above circle)
  const bannerH = s * 0.12;
  const bannerY = cy - s * 0.39;
  // Simple red rect clipped to shield shape
  drawShield(img, cx, bannerY + bannerH * 0.5, s * 0.62, bannerH * 2, RED);
  // White banner over the red to hide bottom half
  const img2 = { bitmap: img.bitmap, scan: img.scan.bind(img), setPixelColor: img.setPixelColor.bind(img) };
  // Re-draw white shield body partially
  const bx0 = Math.floor(cx - s * 0.33);
  const bx1 = Math.ceil(cx + s * 0.33);
  const by0 = Math.floor(bannerY + bannerH);
  const by1 = Math.ceil(cy - s * 0.29);
  img.scan(bx0, by0, bx1 - bx0, by1 - by0, function(x, y) {
    this.setPixelColor(WHITE, x, y);
  });

  // 8. Red bottom banner strip inside shield (below circle)
  const bBot = cy + s * 0.25;
  const bBotEnd = cy + s * 0.375;
  drawShield(img, cx, bBotEnd, s * 0.62, (bBotEnd - bBot) * 2 + s * 0.04, RED);
  // White shield overlap to keep shield shape
  const shieldPoly = [
    [cx - s * 0.335 + s * 0.05, cy - s * 0.39],
    [cx + s * 0.335 - s * 0.05, cy - s * 0.39],
    [cx + s * 0.335, cy - s * 0.39 + s * 0.05],
    [cx + s * 0.335, cy + s * 0.15],
    [cx + s * 0.335 * 0.4, cy + s * 0.39 - s * 0.025],
    [cx, cy + s * 0.39],
    [cx - s * 0.335 * 0.4, cy + s * 0.39 - s * 0.025],
    [cx - s * 0.335, cy + s * 0.15],
    [cx - s * 0.335, cy - s * 0.39 + s * 0.05],
  ];

  // 9. Small bottom tag "1958"
  const tagW = s * 0.25, tagH = s * 0.09;
  const tagCy = cy + s * 0.36;
  const tag = [
    [cx - tagW / 2, tagCy - tagH / 2],
    [cx + tagW / 2, tagCy - tagH / 2],
    [cx + tagW / 2, tagCy + tagH / 2],
    [cx - tagW / 2, tagCy + tagH / 2],
  ];
  fillPolygon(img, tag, WHITE);
  // Inner tag (navy)
  const tag2 = [
    [cx - tagW / 2 + s * 0.01, tagCy - tagH / 2 + s * 0.01],
    [cx + tagW / 2 - s * 0.01, tagCy - tagH / 2 + s * 0.01],
    [cx + tagW / 2 - s * 0.01, tagCy + tagH / 2 - s * 0.01],
    [cx - tagW / 2 + s * 0.01, tagCy + tagH / 2 - s * 0.01],
  ];
  fillPolygon(img, tag2, NAVY);

  // 10. Top blue border line on shield
  const topBorderH = s * 0.01;
  img.scan(
    Math.floor(cx - s * 0.31),
    Math.floor(cy - s * 0.39),
    Math.ceil(s * 0.62),
    Math.ceil(topBorderH),
    function(x, y) { this.setPixelColor(NAVY, x, y); }
  );
}

// ─── Generators ──────────────────────────────────────────────────────────────

async function makeLogoTransparent(size) {
  const img = new Jimp(size, size, TRANSPARENT);
  drawLogo(img, size / 2, size / 2, size);
  return img;
}

async function main() {
  console.log('🎨 Generating Estrella del Sur assets...\n');

  // logo.png — 256×256, transparent bg
  process.stdout.write('  logo.png (256×256)... ');
  {
    const img = await makeLogoTransparent(256);
    await img.writeAsync(path.join(OUT, 'logo.png'));
  }
  console.log('✓');

  // icon.png — 1024×1024, red bg
  process.stdout.write('  icon.png (1024×1024)... ');
  {
    const img = new Jimp(1024, 1024, RED);
    const logo = await makeLogoTransparent(820);
    img.composite(logo, 102, 102);
    await img.writeAsync(path.join(OUT, 'icon.png'));
  }
  console.log('✓');

  // adaptive-icon.png — 1024×1024, red circle bg
  process.stdout.write('  adaptive-icon.png (1024×1024)... ');
  {
    const img = new Jimp(1024, 1024, TRANSPARENT);
    fillCircle(img, 512, 512, 512, RED);
    const logo = await makeLogoTransparent(820);
    img.composite(logo, 102, 102);
    await img.writeAsync(path.join(OUT, 'adaptive-icon.png'));
  }
  console.log('✓');

  // splash.png — 1284×2778, red bg with centered logo
  process.stdout.write('  splash.png (1284×2778)... ');
  {
    const img = new Jimp(1284, 2778, RED);
    // White decorative stripes
    img.scan(0, 1000, 1284, 14, function(x, y) { this.setPixelColor(WHITE, x, y); });
    img.scan(0, 1778, 1284, 14, function(x, y) { this.setPixelColor(WHITE, x, y); });
    // Logo centered vertically
    const logo = await makeLogoTransparent(680);
    img.composite(logo, 302, 1050);
    await img.writeAsync(path.join(OUT, 'splash.png'));
  }
  console.log('✓');

  // notification-icon.png — 96×96, transparent bg, white star
  process.stdout.write('  notification-icon.png (96×96)... ');
  {
    const img = new Jimp(96, 96, TRANSPARENT);
    drawStar(img, 48, 48, 44, 18, WHITE);
    await img.writeAsync(path.join(OUT, 'notification-icon.png'));
  }
  console.log('✓');

  // favicon.png — 48×48, red bg, white star
  process.stdout.write('  favicon.png (48×48)... ');
  {
    const img = new Jimp(48, 48, RED);
    drawStar(img, 24, 24, 20, 8, WHITE);
    await img.writeAsync(path.join(OUT, 'favicon.png'));
  }
  console.log('✓');

  console.log('\n✅ All assets saved to assets/');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
