import { supabase } from "../api-client";

const form    = document.getElementById("loginForm");
const errorEl = document.getElementById("loginError");

supabase.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = "/laboratorium-7/";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.classList.add("hidden");

  const elements = Array.from(e.target.elements);
  const email    = elements.find((el) => el.name === "email").value.trim();
  const password = elements.find((el) => el.name === "password").value;

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    errorEl.textContent = "Błąd logowania: nieprawidłowy e-mail lub hasło.";
    errorEl.classList.remove("hidden");
    return;
  }

  window.location.href = "/laboratorium-7/";
});