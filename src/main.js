import { supabase } from "./api-client";

let isLoggedIn = false;

main();

async function main() {
  const { data: { session } } = await supabase.auth.getSession();
  isLoggedIn = !!session;

  updateAuthUI();
  await loadArticles();
  bindEvents();
}

function updateAuthUI() {
  document.getElementById("btnLogout").classList.toggle("hidden", !isLoggedIn);
  document.getElementById("btnLogin").classList.toggle("hidden", isLoggedIn);
}

async function loadArticles() {
  const container = document.getElementById("articles");
  container.innerHTML = '<p class="text-gray-400 text-center py-12">Wczytuję artykuły…</p>';

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    container.innerHTML = `<p class="text-red-500 text-center py-12">Błąd: ${error.message}</p>`;
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<p class="text-gray-400 text-center py-12">Brak artykułów.</p>';
    return;
  }

  container.innerHTML = data.map(renderArticle).join("");

  if (isLoggedIn) {
    container.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("click", () => deleteArticle(btn.dataset.delete));
    });
    container.querySelectorAll("[data-edit]").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(JSON.parse(btn.dataset.edit)));
    });
  }
}

function renderArticle(article) {
  const { id, title, subtitle, author, content, created_at } = article;
  const date = new Date(created_at).toLocaleDateString("pl-PL", {
    year: "numeric", month: "long", day: "numeric",
  });
  const safeEdit = JSON.stringify(article).replace(/"/g, "&quot;");

  const adminButtons = isLoggedIn
    ? `
      <div class="flex gap-2 mt-4 flex-wrap">
        <button
          data-edit="${safeEdit}"
          class="text-sm px-3 py-1.5 rounded-lg border border-indigo-400 text-indigo-600 hover:bg-indigo-50 active:scale-95 transition-all duration-150"
        >Edytuj</button>
        <button
          data-delete="${id}"
          class="text-sm px-3 py-1.5 rounded-lg border border-red-400 text-red-600 hover:bg-red-50 active:scale-95 transition-all duration-150"
        >Usuń</button>
      </div>`
    : "";

  return `
    <article class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <header class="mb-3">
        <h2 class="text-xl font-bold text-gray-900">${escHtml(title)}</h2>
        ${subtitle ? `<p class="text-gray-500 mt-1">${escHtml(subtitle)}</p>` : ""}
        <div class="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-gray-400">
          <span>Autor: ${escHtml(author || "Nieznany")}</span>
          <time datetime="${created_at}">Data: ${date}</time>
        </div>
      </header>
      <p class="text-gray-700 leading-relaxed whitespace-pre-line">${escHtml(content)}</p>
      ${adminButtons}
    </article>
  `;
}

function escHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function deleteArticle(id) {
  if (!confirm("Na pewno usunąć artykuł?")) return;
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) { alert("Błąd usuwania: " + error.message); return; }
  await loadArticles();
}

const modalAdd  = document.getElementById("modalAdd");
const modalEdit = document.getElementById("modalEdit");

function openAddModal() {
  document.getElementById("formAdd").reset();
  document.getElementById("addError").classList.add("hidden");
  modalAdd.showModal();
}

function openEditModal(article) {
  const form = document.getElementById("formEdit");
  form.elements["id"].value      = article.id;
  form.elements["title"].value   = article.title ?? "";
  form.elements["subtitle"].value = article.subtitle ?? "";
  form.elements["author"].value  = article.author ?? "";
  form.elements["content"].value = article.content ?? "";
  document.getElementById("editError").classList.add("hidden");
  modalEdit.showModal();
}

function bindEvents() {
  document.getElementById("btnAddArticle").addEventListener("click", () => {
    if (!isLoggedIn) {
      window.location.href = "/laboratorium-7/login/";
      return;
    }
    openAddModal();
  });

  document.getElementById("btnLogout").addEventListener("click", async () => {
    await supabase.auth.signOut();
    isLoggedIn = false;
    updateAuthUI();
    await loadArticles();
  });

  document.getElementById("btnAddCancel").addEventListener("click", () => modalAdd.close());

  document.getElementById("btnEditCancel").addEventListener("click", () => modalEdit.close());

  document.getElementById("formAdd").addEventListener("submit", async (e) => {
    e.preventDefault();
    const els = e.target.elements;
    const errEl = document.getElementById("addError");
    errEl.classList.add("hidden");

    const { error } = await supabase.from("articles").insert([{
      title:      els["title"].value.trim(),
      subtitle:   els["subtitle"].value.trim() || null,
      author:     els["author"].value.trim(),
      content:    els["content"].value.trim(),
      created_at: new Date().toISOString(),
    }]);

    if (error) {
      errEl.textContent = "Błąd: " + error.message;
      errEl.classList.remove("hidden");
      return;
    }
    modalAdd.close();
    await loadArticles();
  });

  document.getElementById("formEdit").addEventListener("submit", async (e) => {
    e.preventDefault();
    const els = e.target.elements;
    const errEl = document.getElementById("editError");
    errEl.classList.add("hidden");

    const { error } = await supabase.from("articles").update({
      title:      els["title"].value.trim(),
      subtitle:   els["subtitle"].value.trim() || null,
      author:     els["author"].value.trim(),
      content:    els["content"].value.trim(),
      created_at: new Date().toISOString(),
    }).eq("id", els["id"].value);

    if (error) {
      errEl.textContent = "Błąd: " + error.message;
      errEl.classList.remove("hidden");
      return;
    }
    modalEdit.close();
    await loadArticles();
  });

  [modalAdd, modalEdit].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.close();
    });
  });
}
