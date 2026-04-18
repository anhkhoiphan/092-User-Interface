import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useSelector, useDispatch } from "react-redux";
import { authService } from "../../services/auth.service";
import { updateProfileSuccess } from "../../store/slices/authSlice";
import { usernameColors, fallbackColors } from "../../constants/usernameColors";

const UserProfile = forwardRef(function UserProfile(_, ref) {
  const { isDark } = useSelector((state) => state.theme);
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  const [userName, setUserName] = useState(
    () => localStorage.getItem("userName") || authUser?.name || "Sinh viên",
  );
  const [userAvatar, setUserAvatar] = useState(
    () => localStorage.getItem("userAvatar") || authUser?.avatar || null,
  );
  const [userBio, setUserBio] = useState(
    () => localStorage.getItem("userBio") || authUser?.bio || "",
  );
  const [usernameColor, setUsernameColor] = useState(
    () => localStorage.getItem("usernameColor")?.toLowerCase().trim() || "",
  );
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (authUser) {
      if (!localStorage.getItem("userName")) {
        setUserName(authUser.name || "Sinh viên");
      }
      if (!localStorage.getItem("userAvatar")) {
        setUserAvatar(authUser.avatar || null);
      }
      if (!localStorage.getItem("userBio")) {
        setUserBio(authUser.bio || "");
      }
      if (!localStorage.getItem("usernameColor")) {
        const authColor = authUser.color?.trim();
        const matched = usernameColors.find((c) => c.name === authColor);
        setUsernameColor(matched?.value || usernameColors[0].value);
      }
    }
  }, [authUser]);

  useImperativeHandle(ref, () => ({
    validateAndSave: async () => {
      const trimmedName = userName.trim();
      if (!trimmedName) {
        setNameError("Vui lòng nhập tên hiển thị");
        return { success: false, changed: false };
      }
      setNameError("");

      const trimmedBio = userBio.trim();
      const originalName = authUser?.name || "";
      const originalBio = authUser?.bio || "";
      const originalAvatar = authUser?.avatar || null;

      const hasChanged =
        trimmedName !== originalName ||
        trimmedBio !== originalBio ||
        userAvatar !== originalAvatar;

      if (trimmedBio.length > 500) {
        return { success: false, changed: false, error: "Giới thiệu tối đa 500 ký tự" };
      }

      localStorage.setItem("userName", trimmedName);
      localStorage.setItem("userAvatar", userAvatar);
      localStorage.setItem("userBio", trimmedBio);
      if (usernameColor) {
        localStorage.setItem("usernameColor", usernameColor);
      }

      if (!hasChanged) {
        return { success: true, changed: false };
      }

      try {
        const payload = {
          displayName: trimmedName,
          bio: trimmedBio || null,
          avatar: userAvatar || null,
        };
        const { data } = await authService.updateProfile(payload);
        if (data?.user) {
          dispatch(updateProfileSuccess(data.user));
          localStorage.setItem("auth_user", JSON.stringify(data.user));
        }
        return { success: true, changed: true };
      } catch (err) {
        const msg = err?.response?.data?.message || "Cập nhật thất bại";
        return { success: false, changed: false, error: msg };
      }
    },
  }));

  const handleColorChange = (colorValue) => {
    setUsernameColor(colorValue.trim());
  };

  const currentColorName = usernameColors.find((c) => c.value === usernameColor)?.name || usernameColor;

  return (
    <div
      className="p-4 rounded-lg space-y-4"
      style={{ background: "var(--card-bg-secondary)" }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold"
          style={{
            background: usernameColors.find((c) => c.value === usernameColor)?.hex || "var(--primary)",
            color: isDark ? "var(--bg-surface)" : "#fff",
          }}
        >
          {userAvatar || userName.charAt(0) || "S"}
        </div>
        <div className="flex-1">
          <label
            className="text-xs font-medium mb-1 block"
            style={{ color: "var(--text-secondary)" }}
          >
            Tên hiển thị <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => {
              setUserName(e.target.value);
              if (nameError) setNameError("");
            }}
            placeholder="Nhập tên hiển thị"
            className="w-full px-3 py-2 rounded-md text-sm border outline-none"
            style={{
              background: "var(--input-bg)",
              borderColor: nameError ? "var(--danger)" : "var(--input-border)",
              color: "var(--input-text)",
            }}
            onFocus={(e) =>
              (e.currentTarget.style.borderColor = "var(--primary)")
            }
            onBlur={(e) =>
              (e.currentTarget.style.borderColor = nameError ? "var(--danger)" : "var(--input-border)")
            }
          />
          {nameError && (
            <div className="text-xs mt-1" style={{ color: "var(--danger)" }}>
              {nameError}
            </div>
          )}
        </div>
      </div>
      <div>
        <label
          className="text-xs font-medium mb-1 block"
          style={{ color: "var(--text-secondary)" }}
        >
          Giới thiệu <span style={{ color: "var(--text-muted)" }}>(tùy chọn)</span>
        </label>
        <textarea
          value={userBio}
          onChange={(e) => {
            if (e.target.value.length <= 500) {
              setUserBio(e.target.value);
            }
          }}
          rows={3}
          placeholder="Viết một chút về bản thân..."
          className="w-full px-3 py-2 rounded-md text-sm border outline-none resize-none"
          style={{
            background: "var(--input-bg)",
            borderColor: "var(--input-border)",
            color: "var(--input-text)",
          }}
          onFocus={(e) =>
            (e.currentTarget.style.borderColor = "var(--primary)")
          }
          onBlur={(e) =>
            (e.currentTarget.style.borderColor = "var(--input-border)")
          }
        />
        <div className="text-xs mt-1 text-right" style={{ color: "var(--text-muted)" }}>
          {userBio.length}/500
        </div>
      </div>

      {/* Username Color Picker */}
      <div>
        <label
          className="text-xs font-medium mb-2 block"
          style={{ color: "var(--text-secondary)" }}
        >
          Màu tên hiển thị
        </label>
        <div className="flex flex-wrap gap-2">
          {usernameColors.map((color) => (
            <button
              key={`${color.value}-${usernameColor}`}
              onClick={() => handleColorChange(color.value)}
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
              style={{
                background: color.hex,
                borderColor:
                  usernameColor === color.value
                    ? "#fff"
                    : "transparent",
                boxShadow:
                  usernameColor === color.value
                    ? "0 0 0 2px var(--primary)"
                    : "none",
                transform:
                  usernameColor === color.value ? "scale(1.15)" : "scale(1)",
              }}
              title={color.name}
            >
              {usernameColor === color.value && (
                <span
                  style={{
                    color: "#fff",
                    fontSize: "14px",
                    textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
        {usernameColor && (
          <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Màu hiện tại:{" "}
            <span
              style={{
                color: usernameColors.find((c) => c.value === usernameColor)?.hex || usernameColor,
                fontWeight: "600",
              }}
            >
              {usernameColors.find((c) => c.value === usernameColor)?.name ||
                usernameColor}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default UserProfile;
