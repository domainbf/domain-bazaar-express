#!/usr/bin/env node
/**
 * 页面风格一致性检查脚本
 * 用法: node scripts/design-audit.mjs [--json]
 * 输出: reports/design-consistency.md
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git']);
// shadcn 原语允许保留原始 tailwind 类
const IGNORE_FILES = [/^src\/components\/ui\//];

const PALETTES =
  'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const RULES = [
  {
    id: 'palette-color',
    label: '硬编码调色板颜色（应改用语义 token）',
    re: new RegExp(`(?:^|[\\s"'\`:])(?:dark:)?(?:hover:|focus:|group-hover:)?(?:bg|text|border|ring|from|via|to|fill|stroke)-(?:${PALETTES})-\\d{2,3}`, 'g'),
  },
  { id: 'arbitrary-color', label: '任意值颜色 bg-[#...] / text-[#...]', re: /(?:bg|text|border|ring|fill|stroke)-\[#[0-9a-fA-F]{3,8}\]/g },
  { id: 'absolute-bw', label: 'text-white / bg-white / bg-black / text-black', re: /(?:^|[\s"'`:])(?:dark:)?(?:hover:)?(?:text|bg|border)-(?:white|black)(?![\w-])/g },
  { id: 'container-width', label: '容器宽度偏离 page-container(max-w-6xl)', re: /max-w-(?:7xl|screen-xl|screen-2xl)/g },
  { id: 'heading-scale', label: '标题字号偏离层级（text-4xl+ 未走 Hero/section-title）', re: /text-(?:8xl|9xl)/g },
  { id: 'card-radius', label: '卡片圆角偏离（rounded-3xl / rounded-[..]）', re: /rounded-(?:3xl|\[[^\]]+\])/g },
  { id: 'raw-shadow', label: '原生阴影（应使用 shadow-card / shadow-elegant）', re: /shadow-\[[^\]]+\]|drop-shadow-\[[^\]]+\]/g },
  { id: 'inline-hex', label: '内联样式中的十六进制颜色', re: /(?:color|background|backgroundColor|borderColor)\s*:\s*['"]#[0-9a-fA-F]{3,8}/g },
];

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.has(entry)) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts|css)$/.test(entry)) out.push(p);
  }
  return out;
}

function areaOf(rel) {
  if (rel.startsWith('src/pages/Admin') || rel.includes('/admin/')) return '后台管理';
  if (rel.startsWith('src/pages/')) return '页面';
  if (rel.includes('/usercenter/')) return '用户中心';
  if (rel.includes('/sections/')) return '首页区块';
  if (rel.includes('/marketplace/')) return '域名市场';
  if (rel.includes('/domain/')) return '域名详情';
  if (rel.startsWith('src/components/')) return '通用组件';
  return '其他';
}

const files = walk(SRC).filter((f) => {
  const rel = relative(ROOT, f).replace(/\\/g, '/');
  return !IGNORE_FILES.some((re) => re.test(rel));
});

const findings = [];
for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
    // 邮件 HTML 模板（收件箱环境无法使用 CSS 变量）不受前端 token 约束
    if (line.includes('style="') || /amountBlock\(|infoBox\(|emailShell\(/.test(line)) return;
    if (/design-audit-ignore/.test(line)) return;
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      const matches = line.match(rule.re);
      if (matches) {
        findings.push({
          file: rel,
          area: areaOf(rel),
          line: i + 1,
          rule: rule.id,
          label: rule.label,
          snippet: matches.map((m) => m.trim()).join(', ').slice(0, 120),
        });
      }
    }
  });
}

const byRule = {};
const byArea = {};
const byFile = {};
for (const f of findings) {
  byRule[f.rule] = (byRule[f.rule] || 0) + 1;
  byArea[f.area] = (byArea[f.area] || 0) + 1;
  byFile[f.file] = (byFile[f.file] || 0) + 1;
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ total: findings.length, byRule, byArea, findings }, null, 2));
}

const top = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 25);
const md = [
  '# 页面风格一致性报告',
  '',
  `生成时间: ${new Date().toISOString()}`,
  `扫描文件: ${files.length}　问题总数: **${findings.length}**`,
  '',
  '## 按规则汇总',
  '',
  '| 规则 | 说明 | 数量 |',
  '| --- | --- | --- |',
  ...RULES.map((r) => `| \`${r.id}\` | ${r.label} | ${byRule[r.id] || 0} |`),
  '',
  '## 按页面区域汇总',
  '',
  '| 区域 | 数量 |',
  '| --- | --- |',
  ...Object.entries(byArea).sort((a, b) => b[1] - a[1]).map(([a, n]) => `| ${a} | ${n} |`),
  '',
  '## Top 25 待整改文件',
  '',
  '| 文件 | 数量 |',
  '| --- | --- |',
  ...top.map(([f, n]) => `| \`${f}\` | ${n} |`),
  '',
  '## 明细（前 300 条）',
  '',
  '| 文件:行 | 规则 | 片段 |',
  '| --- | --- | --- |',
  ...findings.slice(0, 300).map((f) => `| \`${f.file}:${f.line}\` | ${f.rule} | \`${f.snippet.replace(/\|/g, '\\|')}\` |`),
  '',
  '> 规范见 docs/design-tokens.md。修复方式：颜色改语义 token，容器改 `.page-container`，卡片/表格/弹窗改用 `src/components/layout/PageLayout.tsx` 中的原语。',
].join('\n');

mkdirSync(join(ROOT, 'reports'), { recursive: true });
writeFileSync(join(ROOT, 'reports/design-consistency.md'), md);
console.log(`Design audit: ${findings.length} findings across ${files.length} files -> reports/design-consistency.md`);
for (const [rule, n] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) console.log(`  ${rule}: ${n}`);
