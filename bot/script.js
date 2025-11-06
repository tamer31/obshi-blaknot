import { supabase } from './supabase.js';

const tablesContainer = document.getElementById("tables");
const addTableBtn = document.getElementById("addTable");
const modal = document.getElementById("modal");
const saveBtn = document.getElementById("saveCard");

let activeTable = null;
let data = [];


async function fetchData() {
  const { data: tables, error } = await supabase.from('tables').select(`
    id,
    title,
    cards (
      id,
      name,
      time,
      cab,
      date
    )
  `);

  if (error) {
    console.error("Ошибка при загрузке данных:", error);
    return;
  }

  data = tables || [];
  renderTables();
}


function renderTables() {
  tablesContainer.innerHTML = "";

  data.forEach((table, tIndex) => {
    const tableDiv = document.createElement("div");
    tableDiv.className = "table";


    const header = document.createElement("div");
    header.className = "table-header";

    const titleInput = document.createElement("input");
    titleInput.value = table.title;
    titleInput.addEventListener("change", () => renameTable(tIndex, titleInput.value));

    const controls = document.createElement("div");

    const addBtn = document.createElement("button");
    addBtn.textContent = "➕";
    addBtn.addEventListener("click", () => addCard(tIndex));

    const delBtn = document.createElement("button");
    delBtn.textContent = "🗑️";
    delBtn.addEventListener("click", () => deleteTable(tIndex));

    controls.appendChild(addBtn);
    controls.appendChild(delBtn);

    header.appendChild(titleInput);
    header.appendChild(controls);
    tableDiv.appendChild(header);


    table.cards?.forEach((card, cIndex) => {
      const div = document.createElement("div");
      div.className = "card";

      const title = document.createElement("b");
      title.textContent = `${card.name} — ${card.time} (${card.cab})`;

      const date = document.createElement("small");
      date.textContent = `🕒 ${new Date(card.date).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "short"
      })}`;

      const del = document.createElement("button");
      del.textContent = "✕";
      del.addEventListener("click", () => deleteCard(tIndex, cIndex));

      div.appendChild(title);
      div.appendChild(date);
      div.appendChild(del);

      tableDiv.appendChild(div);
    });


    const addCardBtn = document.createElement("button");
    addCardBtn.id = "addCard";
    addCardBtn.textContent = "+ Добавить карточку";
    addCardBtn.addEventListener("click", () => addCard(tIndex));
    tableDiv.appendChild(addCardBtn);

    tablesContainer.appendChild(tableDiv);
  });
}


async function addTable() {
  const { data: newTable, error } = await supabase
    .from('tables')
    .insert({ title: "Новая таблица" })
    .select()
    .single();

  if (error) {
    alert("Ошибка при создании таблицы");
    console.error(error);
    return;
  }

  data.push({ ...newTable, cards: [] });
  renderTables();
}


async function renameTable(i, name) {
  name = name.trim() || "Без названия";
  const table = data[i];

  const { error } = await supabase
    .from('tables')
    .update({ title: name })
    .eq('id', table.id);

  if (error) console.error("Ошибка при переименовании:", error);
  else data[i].title = name;
}


async function deleteTable(i) {
  if (!confirm("Удалить таблицу?")) return;

  const table = data[i];

  await supabase.from('cards').delete().eq('table_id', table.id);
  await supabase.from('tables').delete().eq('id', table.id);

  data.splice(i, 1);
  renderTables();
}


function addCard(i) {
  activeTable = i;
  modal.classList.remove("hidden");
}


saveBtn.addEventListener("click", async () => {
  const name = document.getElementById("name").value.trim();
  const time = document.getElementById("time").value.trim();
  const cab = document.getElementById("cab").value.trim();
  const date = document.getElementById("date").value;

  if (!name || !time || !cab || !date) return alert("Заполни все поля");

  const tableId = data[activeTable].id;

  const { data: card, error } = await supabase
    .from('cards')
    .insert({ table_id: tableId, name, time, cab, date })
    .select()
    .single();

  if (error) {
    alert("Ошибка при сохранении карточки");
    console.error(error);
    return;
  }

  data[activeTable].cards.push(card);
  modal.classList.add("hidden");
  renderTables();

  document.getElementById("name").value = "";
  document.getElementById("time").value = "";
  document.getElementById("cab").value = "";
  document.getElementById("date").value = "";
});


async function deleteCard(tableIndex, cardIndex) {
  if (!confirm("Удалить карточку?")) return;

  const card = data[tableIndex].cards[cardIndex];

  await supabase.from('cards').delete().eq('id', card.id);
  data[tableIndex].cards.splice(cardIndex, 1);
  renderTables();
}


modal.addEventListener("click", e => {
  if (e.target === modal) modal.classList.add("hidden");
});

addTableBtn.addEventListener("click", addTable);


fetchData();
