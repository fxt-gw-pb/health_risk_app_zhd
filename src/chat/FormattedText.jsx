// src/chat/FormattedText.jsx — 轻量 markdown 渲染（无依赖）：**加粗** + 换行 + 列表项。
// DeepSeek 回答常含 markdown，这里做最小化美化，避免引入重型依赖。
function renderInline(text, keyPrefix) {
  // 仅处理 **加粗**
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) {
      return <strong key={`${keyPrefix}-${i}`} className="font-bold text-slate-800">{p.slice(2, -2)}</strong>;
    }
    return <span key={`${keyPrefix}-${i}`}>{p}</span>;
  });
}

export default function FormattedText({ text }) {
  const lines = (text || '').split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const t = line.trimStart();
        const bullet = /^([-*•]|\d+[.、)])\s+/.exec(t);
        if (bullet) {
          const content = t.slice(bullet[0].length);
          return (
            <div key={i} className="flex gap-1.5">
              <span className="mt-[2px] shrink-0 text-[#4F8CFF]">{/^\d/.test(bullet[1]) ? bullet[1] : '•'}</span>
              <span className="leading-relaxed">{renderInline(content, i)}</span>
            </div>
          );
        }
        if (t === '') return <div key={i} className="h-1.5" />;
        return <p key={i} className="leading-relaxed">{renderInline(t, i)}</p>;
      })}
    </div>
  );
}
