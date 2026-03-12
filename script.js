// DOM Elements
const nameInput = document.getElementById("nameInput");
const supervisorInput = document.getElementById("supervisorInput");
const roomInput = document.getElementById("roomInput");
const floorInput = document.getElementById("floorInput");
const generateBtn = document.getElementById("generateBtn");
const downloadBtn = document.getElementById("downloadBtn");
const cardPreview = document.getElementById("cardPreview");
const smartCard = document.getElementById("smartCard");
const qrCodeEl = document.getElementById("qrCode");
const cardName = document.getElementById("cardName");
const cardRoom = document.getElementById("cardRoom");
const cardFloor = document.getElementById("cardFloor");
const cardSupervisor = document.getElementById("cardSupervisor");
const savedCardsSection = document.getElementById("savedCardsSection");
const savedCardsList = document.getElementById("savedCardsList");

// State
let qrInstance = null;
const STORAGE_KEY = "itikaf_saved_cards";

// ===== QR Code Generation =====
function generateQRCode(data) {
  qrCodeEl.innerHTML = "";
  if (typeof QRCode === "undefined") {
    qrCodeEl.textContent = "فشل تحميل مكتبة QR";
    return;
  }
  try {
    qrInstance = new QRCode(qrCodeEl, {
      text: data,
      width: 180,
      height: 180,
      colorDark: "#0f766e",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  } catch (e) {
    console.error("QR Code generation error:", e);
    qrCodeEl.textContent = "فشل إنشاء رمز QR";
  }
}

// ===== Card Generation =====
function generateCard() {
  const name = nameInput.value.trim();
  const supervisor = supervisorInput.value.trim();
  const room = roomInput.value.trim();
  const floor = floorInput.value.trim();

  if (!name) {
    nameInput.focus();
    return;
  }

  // Update card fields
  cardName.textContent = name || "—";
  cardRoom.textContent = room || "—";
  cardFloor.textContent = floor || "—";
  cardSupervisor.textContent = supervisor || "—";

  // Generate QR with card data
  const qrData = [
    "بطاقة معتكف",
    "الاسم: " + name,
    room ? "الغرفة: " + room : "",
    floor ? "الدور: " + floor : "",
    supervisor ? "المسؤول: " + supervisor : "",
  ]
    .filter(Boolean)
    .join("\n");

  generateQRCode(qrData);

  // Show card and enable download
  cardPreview.style.display = "flex";
  downloadBtn.disabled = false;

  // Save to local storage
  saveCard({ name, supervisor, room, floor });

  // Scroll to card
  cardPreview.scrollIntoView({ behavior: "smooth", block: "center" });
}

// ===== Export as PNG =====
function getExportOptions(useFilter) {
  var opts = {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: "#111111",
    skipFonts: true,
  };
  if (useFilter) {
    opts.filter = function (node) {
      if (node.tagName === "CANVAS" && node.style && node.style.display === "none") {
        return false;
      }
      return true;
    };
  }
  return opts;
}

function triggerDownload(dataUrl) {
  var link = document.createElement("a");
  link.download =
    "بطاقة-معتكف-" + (cardName.textContent || "card") + ".png";
  link.href = dataUrl;
  link.click();
}

function downloadCard() {
  if (typeof htmlToImage === "undefined") {
    alert("مكتبة التصدير غير متوفرة. يرجى التحقق من اتصال الإنترنت.");
    return;
  }

  htmlToImage
    .toPng(smartCard, getExportOptions(true))
    .then(triggerDownload)
    .catch(function (firstErr) {
      console.warn("First export attempt failed:", firstErr);
      // Retry without filter (simpler clone)
      return htmlToImage
        .toPng(smartCard, getExportOptions(false))
        .then(triggerDownload);
    })
    .catch(function (secondErr) {
      console.warn("Second export attempt failed:", secondErr);
      // Final fallback: use toCanvas directly
      return htmlToImage
        .toCanvas(smartCard, getExportOptions(false))
        .then(function (canvas) {
          triggerDownload(canvas.toDataURL("image/png"));
        });
    })
    .catch(function (finalErr) {
      console.error("All export attempts failed:", finalErr);
      alert("حدث خطأ أثناء تحميل الصورة. يرجى المحاولة مرة أخرى أو استخدام لقطة شاشة.");
    });
}

// ===== Local Storage: Save Multiple Cards =====
function getSavedCards() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveCard(card) {
  var cards = getSavedCards();
  // Avoid duplicates by name
  var exists = cards.findIndex(function (c) {
    return c.name === card.name;
  });
  if (exists >= 0) {
    cards[exists] = card;
  } else {
    cards.push(card);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    // Silently fail if storage is full
  }
  renderSavedCards();
}

function deleteCard(index) {
  var cards = getSavedCards();
  cards.splice(index, 1);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (e) {
    // Silently fail
  }
  renderSavedCards();
}

function loadCard(card) {
  nameInput.value = card.name || "";
  supervisorInput.value = card.supervisor || "";
  roomInput.value = card.room || "";
  floorInput.value = card.floor || "";
  generateCard();
}

function renderSavedCards() {
  var cards = getSavedCards();
  if (cards.length === 0) {
    savedCardsSection.style.display = "none";
    return;
  }

  savedCardsSection.style.display = "block";
  savedCardsList.innerHTML = "";

  cards.forEach(function (card, index) {
    var item = document.createElement("div");
    item.className = "saved-card-item";

    var info = document.createElement("div");
    info.className = "saved-card-item-info";

    var nameEl = document.createElement("span");
    nameEl.className = "saved-card-item-name";
    nameEl.textContent = card.name;

    var detailEl = document.createElement("span");
    detailEl.className = "saved-card-item-detail";
    detailEl.textContent =
      (card.room ? card.room : "") +
      (card.room && card.floor ? " — " : "") +
      (card.floor ? card.floor : "");

    info.appendChild(nameEl);
    info.appendChild(detailEl);

    var deleteBtn = document.createElement("button");
    deleteBtn.className = "saved-card-item-delete";
    deleteBtn.textContent = "✕";
    deleteBtn.setAttribute("aria-label", "حذف البطاقة");
    deleteBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      deleteCard(index);
    });

    item.appendChild(info);
    item.appendChild(deleteBtn);

    item.addEventListener("click", function () {
      loadCard(card);
    });

    savedCardsList.appendChild(item);
  });
}

// ===== Event Listeners =====
generateBtn.addEventListener("click", generateCard);
downloadBtn.addEventListener("click", downloadCard);

// Allow Enter key to generate card
[nameInput, supervisorInput, roomInput, floorInput].forEach(function (input) {
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      generateCard();
    }
  });
});

// ===== Initialize =====
renderSavedCards();
