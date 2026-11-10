"use strict";

// users domain functions.

  function renderStaff() {
    if (!isAdmin()) return `${heading("Tài khoản nhân sự", "Chức năng chỉ dành cho Administrator.")}`;
    return `${heading("Tài khoản nhân sự", "Tạo tài khoản, gán vai trò và phân công phạm vi địa điểm.", button("＋ Tạo tài khoản", "new-user", "btn-primary"))}
      <div class="card table-wrap"><table><thead><tr><th>Nhân sự</th><th>Tên đăng nhập</th><th>Vai trò</th><th>Phạm vi địa điểm</th><th>Trạng thái</th><th></th></tr></thead><tbody>
      ${db.users.map((user) => `<tr><td><div class="table-primary">${safe(user.name)}</div><div class="table-secondary">${safe(user.email)}</div></td><td><span class="mono">${safe(user.username)}</span></td><td>${user.role === "admin" ? `<span class="badge badge-blue">Administrator</span>` : `<span class="badge badge-gray">Content Manager</span>`}</td>
        <td>${user.role === "admin" ? "Toàn hệ thống" : safe((user.locationIds || []).map((id) => locationName(id, "en")).join(", ") || "Chưa phân công")}</td><td>${user.active ? `<span class="badge badge-green">Hoạt động</span>` : `<span class="badge badge-red">Đã khóa</span>`}</td>
        <td><div class="table-actions"><button class="icon-btn" title="Sửa tài khoản" data-action="edit-user" data-id="${user.id}">✎</button><button class="icon-btn" title="${user.active ? "Khóa" : "Mở khóa"}" data-action="toggle-user" data-id="${user.id}">${user.active ? "⊘" : "✓"}</button></div></td></tr>`).join("")}
      </tbody></table></div><div class="notice notice-warn">Tài khoản demo chỉ lưu trong trình duyệt. Không sử dụng mật khẩu thật trong prototype này.</div>`;
  }


  function openUserForm(id = "") {
    if (!isAdmin()) return notify("Chỉ Administrator được quản lý tài khoản.");
    const user = db.users.find((item) => item.id === id);
    const locationChecks = db.locations.filter((place) => place.active || user?.locationIds?.includes(place.id)).map((place) =>
      `<label class="field-check"><input type="checkbox" name="locationIds" value="${place.id}" ${(user?.locationIds || []).includes(place.id) ? "checked" : ""}> ${safe(locationName(place.id, "en"))}</label>`).join("");
    showModal(user ? "Cập nhật tài khoản" : "Tạo tài khoản nhân sự", `<form data-form="user" data-id="${safe(id)}">
      <div class="form-grid">${field("Họ và tên", "name", user?.name || "", { required: true })}${field("Tên đăng nhập", "username", user?.username || "", { required: true })}${field("Email", "email", user?.email || "", { type: "email", required: true })}
      ${selectField("Vai trò", "role", [{ value: "manager", label: "Content Manager" }, { value: "admin", label: "Administrator" }], user?.role || "manager")}
      ${!user ? field("Mật khẩu tạm thời", "password", "", { type: "password", required: true, help: "Tối thiểu 8 ký tự." }) : ""}</div>
      <div class="field"><label>Phạm vi địa điểm (Content Manager phải chọn ít nhất một)</label>${locationChecks || `<div class="small-note">Chưa có địa điểm hoạt động.</div>`}</div>
      ${user ? `<label class="field-check"><input type="checkbox" name="active" ${user.active ? "checked" : ""}> Tài khoản được phép đăng nhập</label><button type="button" class="btn btn-outline btn-sm" data-action="reset-user-password" data-id="${user.id}">Đặt lại mật khẩu</button>` : ""}
      ${formFooter("Hủy", user ? "Lưu tài khoản" : "Tạo tài khoản")}</form>`);
  }

  function openLogin() {
    showModal("Đăng nhập", `<form data-form="login">${field("Tên đăng nhập", "username", "", { required: true })}${field("Mật khẩu", "password", "", { type: "password", required: true })}
      <div class="form-footer" style="justify-content:space-between"><button type="button" class="text-link" data-action="forgot-password">Quên mật khẩu?</button><button type="submit" class="btn btn-primary">Đăng nhập&nbsp; →</button></div>
      <div class="notice notice-info">Demo: <b>admin / admin123</b> hoặc <b>editor / editor123</b>.</div></form>`);
  }

  function processLogin(form) {
    const data = formValues(form);
    const user = db.users.find((item) => item.username.toLowerCase() === String(data.username).trim().toLowerCase());
    const locked = user?.lockedUntil && new Date(user.lockedUntil) > new Date();
    if (locked) return notify(`Tài khoản tạm khóa đến ${new Date(user.lockedUntil).toLocaleTimeString("vi-VN")}.`);
    if (!user || !user.active || user.password !== data.password) {
      if (user) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;
        if (user.failedAttempts >= 5) {
          user.lockedUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
          user.failedAttempts = 0;
        }
        save();
      }
      return notify(user?.active ? "Tên đăng nhập hoặc mật khẩu không chính xác." : "Tài khoản không thể đăng nhập.");
    }
    user.failedAttempts = 0;
    user.lockedUntil = "";
    session = { userId: user.id, at: now() };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    currentPage = "dashboard";
    addAudit("Đăng nhập", user.username);
    save(); closeModal(); render(); notify(`Xin chào ${user.name}.`);
  }

  function openForgotPassword() {
    showModal("Khôi phục mật khẩu", `<form data-form="forgot">${field("Email tài khoản", "email", "", { type: "email", required: true })}
      <div class="notice notice-info">Nếu email hợp lệ, hướng dẫn khôi phục sẽ được gửi. Bản demo không kết nối email; để thử, nhập email của tài khoản demo.</div>
      ${formFooter("Quay lại", "Gửi yêu cầu")}</form>`);
  }

  function processForgot(form) {
    const email = String(formValues(form).email || "").trim().toLowerCase();
    const user = db.users.find((item) => item.email.toLowerCase() === email);
    showModal("Yêu cầu đã tiếp nhận", `<div class="notice notice-info">Nếu email có trong hệ thống, bạn sẽ nhận hướng dẫn khôi phục mật khẩu.</div>
      ${user ? `<div class="notice notice-warn">Chế độ demo: không gửi email thật. Bạn có thể đặt mật khẩu mới ngay tại đây.</div><form data-form="recover" data-id="${user.id}">${field("Mật khẩu mới", "password", "", { type: "password", required: true, help: "Tối thiểu 8 ký tự." })}${field("Nhập lại mật khẩu", "confirm", "", { type: "password", required: true })}${formFooter("Đóng", "Đặt mật khẩu mới")}</form>` : `<div class="form-footer"><button class="btn btn-primary" data-action="close-modal">Đóng</button></div>`}`);
  }

  function processRecover(form) {
    const data = formValues(form);
    if (String(data.password).length < 8) return notify("Mật khẩu phải có ít nhất 8 ký tự.");
    if (data.password !== data.confirm) return notify("Mật khẩu xác nhận không khớp.");
    const user = db.users.find((item) => item.id === form.dataset.id);
    if (!user) return notify("Yêu cầu khôi phục không hợp lệ.");
    user.password = data.password;
    user.failedAttempts = 0;
    user.lockedUntil = "";
    addAudit("Khôi phục mật khẩu", user.username);
    save(); closeModal(); notify("Đã cập nhật mật khẩu.");
  }

  function openChangePassword() {
    showModal("Đổi mật khẩu", `<form data-form="change-password">${field("Mật khẩu hiện tại", "current", "", { type: "password", required: true })}${field("Mật khẩu mới", "password", "", { type: "password", required: true })}${field("Xác nhận mật khẩu mới", "confirm", "", { type: "password", required: true })}${formFooter()}</form>`);
  }

  function saveChangePassword(form) {
    const data = formValues(form);
    const user = actor();
    if (!user || data.current !== user.password) return notify("Mật khẩu hiện tại không chính xác.");
    if (String(data.password).length < 8) return notify("Mật khẩu phải có ít nhất 8 ký tự.");
    if (data.password !== data.confirm) return notify("Mật khẩu xác nhận không khớp.");
    user.password = data.password;
    addAudit("Đổi mật khẩu", user.username);
    save(); closeModal(); notify("Đã đổi mật khẩu.");
  }


  function saveUser(form) {
    const data = formValues(form);
    const id = form.dataset.id;
    let user = db.users.find((item) => item.id === id);
    const username = String(data.username || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    if (db.users.some((item) => item.id !== id && (item.username.toLowerCase() === username.toLowerCase() || item.email.toLowerCase() === email))) {
      return notify("Tên đăng nhập hoặc email đã tồn tại.");
    }
    const locationIds = Array.from(form.querySelectorAll('input[name="locationIds"]:checked')).map((input) => input.value);
    if (data.role === "manager" && locationIds.length === 0) return notify("Content Manager cần được phân công ít nhất một địa điểm.");
    if (user?.role === "manager") {
      const removedScopes = (user.locationIds || []).filter((locationId) => !locationIds.includes(locationId));
      const hasQueuedItems = db.versions.some((version) => version.status === "review" && removedScopes.includes(getPoi(version.poiId)?.locationId));
      if (hasQueuedItems && !confirm("Phạm vi này có nội dung đang chờ duyệt. Thu hồi phân công; Administrator vẫn có thể xử lý nội dung?")) return;
    }
    if (user?.id === actor()?.id && user.role === "admin" && data.role !== "admin" && db.users.filter((item) => item.active && item.role === "admin").length <= 1) {
      return notify("Không thể tự hạ quyền Administrator cuối cùng.");
    }
    if (user?.id === actor()?.id && form.elements.active && !form.elements.active.checked) return notify("Bạn không thể tự khóa tài khoản đang đăng nhập.");
    if (!user) {
      const password = String(data.password || "");
      if (password.length < 8) return notify("Mật khẩu phải có ít nhất 8 ký tự.");
      user = { id: makeId("user"), active: true, password, locationIds: [] };
      db.users.push(user);
    }
    Object.assign(user, { name: String(data.name).trim(), username, email, role: data.role, locationIds });
    if (form.elements.active) user.active = form.elements.active.checked;
    addAudit(id ? "Cập nhật tài khoản" : "Tạo tài khoản", `${username} · ${data.role}`);
    save(); closeModal(); render(); notify(id ? "Đã cập nhật tài khoản." : "Đã tạo tài khoản.");
  }

  function openAccountMenu() {
    const current = actor();
    showModal("Tài khoản", `<div class="mini-row"><div><div class="mini-row-title">${safe(current?.name || "Tài khoản demo")}</div><div class="mini-row-sub">${safe(current?.username || "Chưa đăng nhập")}</div></div>${current ? `<span class="badge badge-blue">${current.role === "admin" ? "Administrator" : "Content Manager"}</span>` : ""}</div>
      <div class="mini-list" style="margin-top:12px">${current ? `<button class="nav-link" data-action="change-password">⌑&nbsp; Đổi mật khẩu</button><button class="nav-link" data-action="logout">⇥&nbsp; Đăng xuất</button>` : `<button class="nav-link" data-action="login">⇥&nbsp; Đăng nhập</button>`}
      <button class="nav-link" data-action="reset-demo">↺&nbsp; Khôi phục dữ liệu mẫu</button></div>`);
  }

  function logOut() {
    if (actor()) addAudit("Đăng xuất", actor().username);
    session = null;
    localStorage.removeItem(SESSION_KEY);
    currentPage = "visitor";
    selectedPoiId = "";
    closeModal(); render(); notify("Đã đăng xuất.");
  }

  function resetDemo() {
    if (!confirm("Khôi phục dữ liệu mẫu sẽ thay thế toàn bộ dữ liệu DiDau trong trình duyệt này. Tiếp tục?")) return;
    db = initialData();
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(HISTORY_KEY);
    localStorage.removeItem(LANG_KEY);
    session = null;
    currentLocale = "";
    currentPage = "visitor";
    selectedPoiId = "";
    history.replaceState({}, "", location.pathname);
    closeModal(); render(); notify("Đã khôi phục dữ liệu mẫu.");
  }

