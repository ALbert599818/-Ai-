/**
 * 把一张 PNG/JPG 图转成多尺寸 Windows 图标 build/icon.ico。
 * 用法：node scripts/make-icon.js <图片路径>
 * 不传参数时默认读 build/icon-source.png。
 */
const sharp = require('sharp');
const pngToIco = require('png-to-ico');
const fs = require('fs');
const path = require('path');

const toIco = pngToIco.imagesToIco || pngToIco.default || pngToIco;

const SRC = process.argv[2] || path.join(__dirname, '..', 'build', 'icon-source.png');
const OUT = path.join(__dirname, '..', 'build', 'icon.ico');
const SIZES = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('✗ 找不到图片：' + SRC);
    process.exit(1);
  }

  const buffers = [];
  for (const s of SIZES) {
    // png-to-ico 需要的是「原始 RGBA 像素」对象 { data, width, height }
    const raw = await sharp(SRC)
      .rotate() // 处理 EXIF 旋转
      .resize(s, s, { fit: 'cover' }) // 居中裁剪成正方形
      .ensureAlpha() // 保证 4 通道 RGBA
      .raw()
      .toBuffer({ resolveWithObject: true });
    buffers.push({
      data: raw.data,
      width: raw.info.width,
      height: raw.info.height,
    });
  }

  const ico = await toIco(buffers);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, ico);
  console.log(`✔ 已生成 ${OUT}（${ico.length} 字节，尺寸 ${SIZES.join('/')}px）`);
}

main().catch((e) => {
  console.error('生成图标失败：', e);
  process.exit(1);
});
