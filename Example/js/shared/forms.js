"use strict";

// forms domain functions.

function showModal(title, body, className = "") {
    dialog.className = `dialog ${className}`;
    dialog.innerHTML = `<div class="dialog-head"><h2>${safe(title)}</h2><button class="icon-btn" data-action="close-modal" aria-label="Đóng">✕</button></div><div class="dialog-body">${body}</div>`;
    dialog.showModal();
  }

  function closeModal() {
    if (dialog.open) dialog.close();
  }

  function field(label, name, value = "", options = {}) {
    const type = options.type || "text";
    const required = options.required ? "required" : "";
    const placeholder = options.placeholder ? `placeholder="${safe(options.placeholder)}"` : "";
    const attrs = options.attrs || "";
    if (type === "textarea") return `<div class="field ${options.full ? "full" : ""}"><label>${safe(label)}</label><textarea class="textarea" name="${safe(name)}" rows="${options.rows || 3}" ${required} ${placeholder} ${attrs}>${safe(value)}</textarea>${options.help ? `<small>${safe(options.help)}</small>` : ""}</div>`;
    return `<div class="field ${options.full ? "full" : ""}"><label>${safe(label)}</label><input class="input" type="${safe(type)}" name="${safe(name)}" value="${safe(value)}" ${required} ${placeholder} ${attrs}>${options.help ? `<small>${safe(options.help)}</small>` : ""}</div>`;
  }

  function selectField(label, name, options, selected, required = true) {
    return `<div class="field"><label>${safe(label)}</label><select class="select" style="width:100%" name="${safe(name)}" ${required ? "required" : ""}>${options.map((item) => `<option value="${safe(item.value)}" ${item.value === selected ? "selected" : ""}>${safe(item.label)}</option>`).join("")}</select></div>`;
  }

  function formFooter(cancelText = "Hủy", submitText = "Lưu thay đổi") {
    return `<div class="form-footer"><button type="button" class="btn btn-outline" data-action="close-modal">${safe(cancelText)}</button><button type="submit" class="btn btn-primary">${safe(submitText)}</button></div>`;
  }

function formValues(form) {
    return Object.fromEntries(new FormData(form).entries());
  }

  function localizedForm(form, prefix, codes) {
    const result = {};
    for (const code of codes) {
      const value = new FormData(form).get(`${prefix}_${code}`);
      if (String(value || "").trim()) result[code] = String(value).trim();
    }
    return result;
  }
