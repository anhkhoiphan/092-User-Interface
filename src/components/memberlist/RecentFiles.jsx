import { recentFiles } from "../../data/mockData";
import SharedFile from "./SharedFile";

function RecentFiles({ isDark }) {
  return (
    <div
      className="p-3 border-t"
      style={{ borderColor: "var(--border-primary)" }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-wider mb-3 px-2"
        style={{ color: "var(--text-muted)" }}
      >
        Tài liệu gần đây
      </div>
      {recentFiles.map((file) => (
        <SharedFile
          key={file.id}
          isDark={isDark}
          fileName={file.name}
          time={`${file.sharedBy} · ${file.date}`}
          type={file.type}
        />
      ))}
    </div>
  );
}

export default RecentFiles;
