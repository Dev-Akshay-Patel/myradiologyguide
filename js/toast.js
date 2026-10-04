/**
 * TOAST NOTIFICATION MODULE
 * Minimalistic, modern, themed toast notification system.
 * Features deduplication, stack management, custom SVG icons (tick, cross, warning, info, question, delete, wifi on, no network, loader), and mobile slide-in.
 */

const activeToasts = new Map();

// SVG Icons Registry
const ICONS = {
  // Tick (Success)
  tick: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="toast-icon" aria-hidden="true">
      <g clip-path="url(#clip0_toast_tick)">
        <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M7.75 11.9999L10.58 14.8299L16.25 9.16992" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_toast_tick">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,

  // Cross (Error / Fail)
  cross: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="toast-icon" aria-hidden="true">
      <g clip-path="url(#clip0_toast_cross)">
        <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9.17004 14.8299L14.83 9.16992" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M14.83 14.8299L9.17004 9.16992" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_toast_cross">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,

  // Warning (Alert)
  warning: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="toast-icon" aria-hidden="true">
      <g clip-path="url(#clip0_toast_warning)">
        <path d="M12 9V14" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12.0001 21.4093H5.94005C2.47005 21.4093 1.02005 18.9293 2.70005 15.8993L5.82006 10.2793L8.76006 4.9993C10.5401 1.7893 13.4601 1.7893 15.2401 4.9993L18.1801 10.2893L21.3001 15.9093C22.9801 18.9393 21.5201 21.4193 18.0601 21.4193H12.0001V21.4093Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M11.9945 17H12.0035" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_toast_warning">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,

  // Info
  info: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="toast-icon" aria-hidden="true">
      <g clip-path="url(#clip0_toast_info)">
        <path d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M12 8V13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M11.9945 16H12.0035" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_toast_info">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,

  // Question / Help
  question: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <path d="M12 17h.01"/>
    </svg>
  `,

  // Delete / Trash
  delete: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" class="toast-icon" aria-hidden="true">
      <g clip-path="url(#clip0_toast_delete)">
        <path d="M21 5.98047C17.67 5.65047 14.32 5.48047 10.98 5.48047C9 5.48047 7.02 5.58047 5.04 5.78047L3 5.98047" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M8.5 4.97L8.72 3.66C8.88 2.71 9 2 10.69 2H13.31C15 2 15.13 2.75 15.28 3.67L15.5 4.97" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M18.85 9.14062L18.2 19.2106C18.09 20.7806 18 22.0006 15.21 22.0006H8.79002C6.00002 22.0006 5.91002 20.7806 5.80002 19.2106L5.15002 9.14062" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M10.33 16.5H13.66" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M9.5 12.5H14.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
      </g>
      <defs>
        <clipPath id="clip0_toast_delete">
          <rect width="24" height="24" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  `,

  // Wifi On (Network Online)
  wifi: `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true">
      <path d="M12 20h.01"/>
      <path d="M2 8.82a15 15 0 0 1 20 0"/>
      <path d="M5 12.859a10 10 0 0 1 14 0"/>
      <path d="M8.5 16.429a5 5 0 0 1 7 0"/>
    </svg>
  `,

  // No Network (Wifi Off / Offline)
  "no-network": `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="toast-icon" aria-hidden="true">
      <path d="M12 20h.01"/>
      <path d="M8.5 16.429a5 5 0 0 1 7 0"/>
      <path d="M5 12.859a10 10 0 0 1 5.17-2.69"/>
      <path d="M19 12.859a10 10 0 0 0-2.007-1.523"/>
      <path d="M2 8.82a15 15 0 0 1 4.177-2.643"/>
      <path d="M22 8.82a15 15 0 0 0-11.288-3.764"/>
      <path d="m2 2 20 20"/>
    </svg>
  `,

  // Loading
  loading: `
    <svg class="toast-loader toast-icon" viewBox="0 0 40 40" width="20" height="20" aria-hidden="true">
      <circle class="toast-loader-track" cx="20" cy="20" r="17.5" pathLength="100" stroke-width="5" fill="none"></circle>
      <circle class="toast-loader-car" cx="20" cy="20" r="17.5" pathLength="100" stroke-width="5" fill="none"></circle>
    </svg>
  `
};

// Aliases for type lookups
ICONS.success = ICONS.tick;
ICONS.error = ICONS.cross;
ICONS.warn = ICONS.warning;
ICONS.online = ICONS.wifi;
ICONS.network = ICONS.wifi;
ICONS.offline = ICONS["no-network"];
ICONS.nowifi = ICONS["no-network"];
ICONS["wifi-off"] = ICONS["no-network"];
ICONS.help = ICONS.question;
ICONS.trash = ICONS.delete;

/**
 * Global showToast function with deduplication and active stack management
 * @param {string} message - Message text
 * @param {string} [type="success"] - "success"|"tick"|"error"|"cross"|"warning"|"info"|"question"|"delete"|"wifi"|"no-network"|"loading"
 * @param {number} [duration=8000] - Auto-dismiss delay in ms (0 for infinite)
 * @param {string} [id=`${type}:${message}`] - Unique key for deduplication
 */
function showToast(
  message,
  type = "success",
  duration = 8000,
  id = `${type}:${message}`
) {
  if (!message && message !== 0) return null;

  // Normalize type
  const normalizedType = String(type || "success").toLowerCase().trim();

  // Auto-resolve or create container element
  let container = document.getElementById("toast-container");
  if (!container) {
    if (typeof document === "undefined" || !document.body) {
      if (typeof window !== "undefined") {
        window.addEventListener("DOMContentLoaded", () => showToast(message, type, duration, id));
      }
      return null;
    }
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }

  // Reuse / update existing active toast if key already exists (prevents duplicate spamming)
  if (activeToasts.has(id)) {
    const existing = activeToasts.get(id);
    existing.update(message, normalizedType, duration);
    return existing;
  }

  // Stacking prevention: limit maximum simultaneous active toasts to 4
  if (activeToasts.size >= 4) {
    const oldestKey = activeToasts.keys().next().value;
    const oldestToast = activeToasts.get(oldestKey);
    if (oldestToast && typeof oldestToast.dismiss === "function") {
      oldestToast.dismiss();
    }
  }

  const toast = document.createElement("div");
  toast.className = `toast ${normalizedType}`;

  function render(text, toastType) {
    const safeType = String(toastType || "success").toLowerCase().trim();
    toast.className = `toast ${safeType}`;
    const iconHtml = ICONS[safeType] || ICONS.success;
    toast.innerHTML = `
      <i>${iconHtml}</i>
      <span>${escapeHtml(String(text))}</span>
    `;
  }

  render(message, normalizedType);
  container.appendChild(toast);

  let timer;
  let remaining = duration;
  let startedAt = Date.now();

  function dismiss(delay = duration) {
    clearTimeout(timer);
    if (delay === 0) return;

    timer = setTimeout(() => {
      activeToasts.delete(id);
      toast.classList.add("hide");
      toast.addEventListener(
        "animationend",
        () => {
          if (toast.parentNode) {
            toast.remove();
          }
        },
        { once: true }
      );
    }, delay);
  }

  dismiss();

  // Pause on hover
  if (duration > 0) {
    toast.addEventListener("mouseenter", () => {
      clearTimeout(timer);
      const elapsed = Date.now() - startedAt;
      remaining = Math.max(0, remaining - elapsed);
    });

    toast.addEventListener("mouseleave", () => {
      startedAt = Date.now();
      dismiss(remaining);
    });
  }

  const api = {
    element: toast,
    update(newMessage, newType = "success", newDuration = 8000) {
      render(newMessage, newType);
      toast.classList.remove("hide");
      remaining = newDuration;
      startedAt = Date.now();
      dismiss(newDuration);
      return api;
    },
    dismiss() {
      clearTimeout(timer);
      activeToasts.delete(id);
      toast.classList.add("hide");
      toast.addEventListener(
        "animationend",
        () => {
          if (toast.parentNode) {
            toast.remove();
          }
        },
        { once: true }
      );
    }
  };

  activeToasts.set(id, api);
  return api;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Convenience object API
const Toast = {
  show: showToast,
  success: (msg, dur, id) => showToast(msg, "success", dur, id),
  tick: (msg, dur, id) => showToast(msg, "tick", dur, id),
  error: (msg, dur, id) => showToast(msg, "error", dur, id),
  cross: (msg, dur, id) => showToast(msg, "cross", dur, id),
  warning: (msg, dur, id) => showToast(msg, "warning", dur, id),
  info: (msg, dur, id) => showToast(msg, "info", dur, id),
  question: (msg, dur, id) => showToast(msg, "question", dur, id),
  delete: (msg, dur, id) => showToast(msg, "delete", dur, id),
  wifi: (msg, dur, id) => showToast(msg, "wifi", dur, id),
  online: (msg, dur, id) => showToast(msg, "online", dur, id),
  offline: (msg, dur, id) => showToast(msg, "offline", dur, id),
  noNetwork: (msg, dur, id) => showToast(msg, "no-network", dur, id),
  loading: (msg, dur, id) => showToast(msg, "loading", dur, id)
};

// Global Attachments for Browser Environment
if (typeof window !== "undefined") {
  window.activeToasts = activeToasts;
  window.showToast = showToast;
  window.Toast = Toast;
  window.AppToast = Toast;

  function bindAuthToast() {
    if (window.RadiologyAuth) {
      window.RadiologyAuth.showToast = function (message, type = "info") {
        return showToast(message, type);
      };
    }
  }
  bindAuthToast();
  window.addEventListener("DOMContentLoaded", bindAuthToast);
}

// ES module / CommonJS export support
if (typeof exports !== "undefined") {
  exports.activeToasts = activeToasts;
  exports.showToast = showToast;
  exports.Toast = Toast;
}
