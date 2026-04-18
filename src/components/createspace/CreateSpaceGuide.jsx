import { useSelector } from "react-redux";
import { FiCheckCircle } from "react-icons/fi";

function CreateSpaceGuide() {
  const { isDark } = useSelector((state) => state.theme);

  const steps = [
    { num: 1, text: "Chọn icon cho space" },
    { num: 2, text: "Nhập tên space" },
    { num: 3, text: "Thêm mô tả (tùy chọn)" },
    { num: 4, text: 'Nhấn "Tạo Space"' },
  ];

  return (
    <div
      className="w-60 min-w-60 flex flex-col h-screen border-r"
      style={{
        background: "var(--bg-surface-secondary)",
        borderColor: "var(--border-primary)",
      }}
    >
      <div
        className="p-4 border-b"
        style={{ borderColor: "var(--border-primary)" }}
      >
        <div
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Tạo Space
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div
          className="p-4 rounded-lg"
          style={{ background: "var(--card-bg-secondary)" }}
        >
          <div className="text-4xl mb-3" style={{ color: "var(--primary)" }}>
            <FiCheckCircle size={40} />
          </div>
          <div
            className="text-sm font-medium mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Các bước tạo Space
          </div>
          <ol
            className="text-xs space-y-2"
            style={{ color: "var(--text-secondary)" }}
          >
            {steps.map((step) => (
              <li key={step.num} className="flex gap-2">
                <span
                  className="font-medium"
                  style={{ color: "var(--primary)" }}
                >
                  {step.num}.
                </span>
                {step.text}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default CreateSpaceGuide;
