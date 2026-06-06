import { supabase } from "../api-client";

// Jeśli już zalogowany – wróć na stronę główną
const { data: { session } } = await supabase.auth.getSession();
if (session) window.location.href = "/";

const form     = document.getElementById("loginForm");
const errorEl  = document.getElementById("loginError");

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

  window.location.href = "/";
});
