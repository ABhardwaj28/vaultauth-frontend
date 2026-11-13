/**
 * VaultAuth SSO — Client Application Entrypoint
 * Initial foundation script coordinating UI events and backend health.
 */
import { api } from "./api.js";

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const statusPill = document.getElementById("backend-status");
  const statusText = document.getElementById("backend-status-text");
  const tabLogin = document.getElementById("tab-login");
  const tabRegister = document.getElementById("tab-register");
  const authForm = document.getElementById("auth-form");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const passwordHint = document.getElementById("password-hint");
  const btnSubmit = document.getElementById("btn-submit");
  const btnText = document.getElementById("btn-text");
  const btnSpinner = document.getElementById("btn-spinner");
  const alertBox = document.getElementById("alert-box");
  const sessionBox = document.getElementById("session-box");
  const btnLogout = document.getElementById("btn-logout");

  let currentMode = "login"; // "login" | "register"

  // 1. Initial Health Handshake with Backend
  async function initHealthCheck() {
    statusText.textContent = "Connecting to API...";
    const health = await api.checkHealth();
    if (health.ok) {
      statusPill.className = "status-pill online";
      statusText.textContent = "Backend: Online";
    } else {
      statusPill.className = "status-pill offline";
      statusText.textContent = "Backend: Offline";
    }
  }

  // 2. Alert Notification Helper
  function showAlert(message, type = "danger") {
    alertBox.className = `alert alert-${type} small py-2 px-3 mb-3`;
    alertBox.textContent = message;
    alertBox.classList.remove("d-none");
  }

  function hideAlert() {
    alertBox.classList.add("d-none");
    alertBox.textContent = "";
  }

  // 3. Tab Navigation
  tabLogin.addEventListener("click", () => {
    currentMode = "login";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    btnText.textContent = "Authenticate";
    passwordHint.classList.add("d-none");
    hideAlert();
  });

  tabRegister.addEventListener("click", () => {
    currentMode = "register";
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    btnText.textContent = "Create Account";
    passwordHint.classList.remove("d-none");
    hideAlert();
  });

  // 4. Form Submission Handler
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
      showAlert("Please enter both email and password.");
      return;
    }

    // Set UI Loading State
    btnSubmit.disabled = true;
    btnSpinner.classList.remove("d-none");

    try {
      if (currentMode === "register") {
        const res = await api.register(email, password);
        showAlert(res.message || "Account registered! You can now sign in.", "success");
        // Auto-switch to login tab
        tabLogin.click();
      } else {
        const res = await api.login(email, password);
        if (res.token) {
          sessionStorage.setItem("vaultauth_token", res.token);
          sessionStorage.setItem("vaultauth_email", res.email);
          sessionStorage.setItem("vaultauth_role", res.role);

          authForm.classList.add("d-none");
          sessionBox.classList.remove("d-none");
          showAlert(`Welcome, ${res.email}! Authenticated as [${res.role.toUpperCase()}].`, "success");
        }
      }
    } catch (err) {
      showAlert(err.message || "Operation failed. Please try again.");
    } finally {
      btnSubmit.disabled = false;
      btnSpinner.classList.add("d-none");
    }
  });

  // 5. Sign Out Handler
  btnLogout.addEventListener("click", () => {
    sessionStorage.clear();
    sessionBox.classList.add("d-none");
    authForm.classList.remove("d-none");
    emailInput.value = "";
    passwordInput.value = "";
    showAlert("Signed out successfully.", "info");
  });

  // Execute Initial Handshake
  initHealthCheck();
});
