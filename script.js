
"use strict";

/* TOP ILOVA — LOGIN VA ILOVALAR */
const $ = id => document.getElementById(id);

const screens = {
  logo: $("logoScreen"),
  hello: $("helloScreen"),
  start: $("startScreen"),
  auth: $("authScreen"),
  main: $("mainSite")
};

const ACCOUNT_KEY = "topilova_accounts_v2";
const SESSION_KEY = "topilova_session_v2";

let authMode = "login";
let toastTimer;

/* XAVFSIZROQ JSON O'QISH */
function readStore(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function notify(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function showScreen(name) {
  Object.values(screens).forEach(screen => {
    screen.style.display = "none";
  });

  if (name === "main") {
    screens.main.style.display = "block";
  } else {
    screens[name].style.display = "flex";
  }
}

function getSession() {
  const session = readStore(SESSION_KEY, null);
  if (!session || typeof session.username !== "string") return null;

  const accounts = readStore(ACCOUNT_KEY, {});
  return accounts[session.username] ? session.username : null;
}

function updateMain() {
  const username = getSession();

  if (!username) {
    showScreen("start");
    return;
  }

  $("userBadge").innerHTML =
    '<i class="fa-solid fa-user"></i> ' + escapeHTML(username);

  showScreen("main");
}

/* HTML MATNINI XAVFSIZ CHIQARISH */
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

/* PAROL XESHI: FAQAT DEMO UCHUN */
async function hashPassword(password) {
  if (!window.crypto?.subtle) {
    throw new Error("HTTPS orqali oching yoki xavfsiz brauzerdan foydalaning.");
  }

  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, "0"))
    .join("");
}

/* LOGIN EKRANI */
function setAuthMode(mode) {
  authMode = mode;
  $("authError").textContent = "";
  $("password").value = "";

  if (mode === "register") {
    $("authTitle").textContent = "Hisob yarating";
    $("authDescription").textContent =
      "Istalgan username va o'zingiz tanlagan parolni yarating.";
    $("submitAuth").innerHTML =
      'Hisob yaratish <i class="fa-solid fa-arrow-right"></i>';
    $("switchText").textContent = "Hisobingiz bormi?";
    $("switchMode").textContent = "Hisobga kirish";
    $("password").autocomplete = "new-password";
  } else {
    $("authTitle").textContent = "Xush kelibsiz!";
    $("authDescription").textContent =
      "Username va parolingiz bilan hisobingizga kiring.";
    $("submitAuth").innerHTML =
      'Hisobga kirish <i class="fa-solid fa-arrow-right"></i>';
    $("switchText").textContent = "Hisobingiz yo'qmi?";
    $("switchMode").textContent = "Hisob yaratish";
    $("password").autocomplete = "current-password";
  }
}

$("continueButton").addEventListener("click", () => {
  $("username").value = "";
  $("password").value = "";
  setAuthMode("login");
  showScreen("auth");
});

$("authBack").addEventListener("click", event => {
  event.preventDefault();
  showScreen("start");
});

$("switchMode").addEventListener("click", () => {
  setAuthMode(authMode === "login" ? "register" : "login");
});

$("togglePassword").addEventListener("click", () => {
  const input = $("password");
  const show = input.type === "password";

  input.type = show ? "text" : "password";
  $("togglePassword").innerHTML = show
    ? '<i class="fa-solid fa-eye-slash"></i>'
    : '<i class="fa-solid fa-eye"></i>';
});

/*
  Username uchun faqat bitta qoida: @ belgisi bilan boshlansin.
  Uzunlik va boshqa belgilar bo'yicha cheklov yo'q.
  Parol istalgan uzunlikda va istalgan belgilar bilan bo'lishi mumkin,
  faqat bo'sh qoldirilmasin.
*/
function validateCredentials(username, password) {
  if (!username.startsWith("@")) {
    return "Username @ belgisi bilan boshlanishi kerak.";
  }

  if (password.length === 0) {
    return "Parol kiriting.";
  }

  return "";
}

$("authForm").addEventListener("submit", async event => {
  event.preventDefault();
  $("authError").textContent = "";

  const username = $("username").value.trim();
  const password = $("password").value;

  const validationError = validateCredentials(username, password);

  if (validationError) {
    $("authError").textContent = validationError;
    return;
  }

  const normalized = username.toLowerCase();
  const accounts = readStore(ACCOUNT_KEY, {});

  try {
    const passwordHash = await hashPassword(password);

    if (authMode === "register") {
      if (accounts[normalized]) {
        $("authError").textContent =
          "Bu username allaqachon mavjud. Boshqa username tanlang.";
        return;
      }

      accounts[normalized] = {
        passwordHash,
        createdAt: new Date().toISOString()
      };

      writeStore(ACCOUNT_KEY, accounts);
      writeStore(SESSION_KEY, { username: normalized });

      notify("Hisobingiz yaratildi!");
      updateMain();
      return;
    }

    const account = accounts[normalized];

    if (!account || account.passwordHash !== passwordHash) {
      $("authError").textContent =
        "Username yoki parol noto'g'ri. Birinchi marta bo'lsa, hisob yarating.";
      return;
    }

    writeStore(SESSION_KEY, { username: normalized });
    notify("Xush kelibsiz!");
    updateMain();
  } catch (error) {
    $("authError").textContent =
      error.message || "Xatolik yuz berdi. Qayta urinib ko'ring.";
  }
});

/* ILOVALAR RO'YXATI */
const apps = [
  {
    name: "Telegram",
    icon: "fa-brands fa-telegram",
    text: "Xabarlar, kanallar va foydali botlar platformasi.",
    link: "https://telegram.org/"
  },
  {
    name: "ChatGPT",
    icon: "fa-solid fa-robot",
    text: "Sun'iy intellekt yordamchisi.",
    link: "https://chatgpt.com/"
  },
  {
    name: "Instagram",
    icon: "fa-brands fa-instagram",
    text: "Rasm va video ulashish platformasi.",
    link: "https://www.instagram.com/"
  },
  {
    name: "WhatsApp",
    icon: "fa-brands fa-whatsapp",
    text: "Xabar va qo'ng'iroqlar uchun messenjer.",
    link: "https://www.whatsapp.com/"
  },
  {
    name: "YouTube",
    icon: "fa-brands fa-youtube",
    text: "Video tomosha qilish platformasi.",
    link: "https://www.youtube.com/"
  },
  {
    name: "TikTok",
    icon: "fa-brands fa-tiktok",
    text: "Qisqa videolar platformasi.",
    link: "https://www.tiktok.com/"
  },
  {
    name: "Canva",
    icon: "fa-solid fa-palette",
    text: "Logo, banner va dizaynlar yaratish platformasi.",
    link: "https://www.canva.com/"
  },
  {
    name: "CapCut",
    icon: "fa-solid fa-video",
    text: "Video montaj qilish ilovasi.",
    link: "https://www.capcut.com/"
  },
  {
    name: "Google",
    icon: "fa-brands fa-google",
    text: "Internet qidiruv tizimi.",
    link: "https://www.google.com/"
  },
  {
    name: "Spotify",
    icon: "fa-brands fa-spotify",
    text: "Musiqa va podkast tinglash platformasi.",
    link: "https://www.spotify.com/"
  }
];

/* KARTALARNI CHIQARISH */
function showApps(list) {
  const results = $("results");
  results.replaceChildren();

  $("appCount").textContent = `${list.length} ta ilova`;

  if (list.length === 0) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.innerHTML =
      '<i class="fa-solid fa-magnifying-glass"></i><br><br>Ilova topilmadi. Boshqa nom bilan qidirib ko\'ring.';
    results.appendChild(empty);
    return;
  }

  list.forEach((app, index) => {
    const card = document.createElement("article");
    card.className = "card";
    card.style.animationDelay = `${index * 45}ms`;

    const iconBox = document.createElement("div");
    iconBox.className = "app-icon";

    const icon = document.createElement("i");
    icon.className = app.icon;
    iconBox.appendChild(icon);

    const title = document.createElement("h2");
    title.textContent = app.name;

    const description = document.createElement("p");
    description.textContent = app.text;

    const link = document.createElement("a");
    link.className = "app-btn";
    link.href = app.link;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.innerHTML =
      'Ochish <i class="fa-solid fa-arrow-up-right-from-square"></i>';

    card.append(iconBox, title, description, link);
    results.appendChild(card);
  });
}

/* QIDIRUV */
function searchApps() {
  const query = $("searchInput").value.trim().toLocaleLowerCase("uz");

  const filtered = apps.filter(app =>
    (app.name + " " + app.text).toLocaleLowerCase("uz").includes(query)
  );

  showApps(filtered);
}

$("searchInput").addEventListener("input", searchApps);
$("searchButton").addEventListener("click", searchApps);

$("searchInput").addEventListener("keydown", event => {
  if (event.key === "Enter") searchApps();
});

/* INSTAGRAM */
$("instagramButton").addEventListener("click", () => {
  window.open(
    "https://www.instagram.com/sherzod.qoshmurodov1/",
    "_blank",
    "noopener,noreferrer"
  );
});

/* LOGO BOSILGANDA */
$("homeLogo").addEventListener("click", event => {
  event.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* HISOBDAN CHIQISH */
$("logoutButton").addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  $("username").value = "";
  $("password").value = "";
  showScreen("start");
  notify("Hisobdan chiqdingiz.");
});

/* BOSHLANG'ICH ANIMATSIYALAR */
showApps(apps);
showScreen("logo");

setTimeout(() => {
  showScreen("hello");
}, 3000);

setTimeout(() => {
  showScreen("start");
}, 6500);
