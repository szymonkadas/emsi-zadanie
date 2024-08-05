const worker = new Worker("kontrahenciWorker.js");
worker.onmessage = function (e) {
  if (e.data.topic === "dataInitialized") {
    console.log("Data initialized from Worker");
  } else if (e.data.topic === "result") {
    console.log("Data fetched from Worker:", e.data.results);
    updateFilteredTable(e.data.results);
    showFilteredTable();
    handleCloseModal();
  } else if (e.data.topic === "updated") {
    console.log("Data updated from Worker:", e.data.updated);
  } else if (e.data.topic === "updateError") {
    console.error("Error updating data from Worker:", e.data.error);
  } else if (e.data.topic === "added") {
    console.log("Data added from Worker:", e.data.added);
  } else if (e.data.topic === "addError") {
    console.error("Error adding data from Worker:", e.data.error);
  } else if (e.data.topic === "deleted") {
    console.log("Data deleted from Worker:", e.data.deleted);
  } else if (e.data.topic === "deleteError") {
    console.error("Error deleting data from Worker:", e.data.message);
  }
};

const possibleStates = {
  idle: "idle",
  adding: "adding",
  editing: "editing",
  deleting: "deleting",
};
class PanelSterowaniaState {
  state = "idle";
  possibleStates = {
    idle: "idle",
    adding: "adding",
    editing: "editing",
    deleting: "deleting",
  };
  constructor(state = this.possibleStates.idle) {
    this.state = state;
  }

  setState(newState) {
    this.state = this.possibleStates[newState];
  }
}
const StanPaneluSterowania = new PanelSterowaniaState();

function updateState(newState) {
  StanPaneluSterowania.setState(newState);
  const fullDataForm = document.getElementById("pełneDane");
  const searchForm = document.getElementById("wyszukajKontrahenta");
  const addingElements = document.getElementsByClassName("adding");
  const editingElements = document.getElementsByClassName("editing");
  const deletingElements = document.getElementsByClassName("deleting");

  const hideElements = () => {
    fullDataForm.classList.add("hidden");
    searchForm.classList.add("hidden");
  };

  const showElements = () => {
    fullDataForm.classList.remove("hidden");
    searchForm.classList.remove("hidden");
  };

  const hideFormElements = (elements) => {
    for (let element of elements) {
      element.classList.add("hidden");
    }
  };

  const showFormElements = (elements) => {
    for (let element of elements) {
      element.classList.remove("hidden");
    }
  };

  if (StanPaneluSterowania.state === "idle") {
    hideElements();
  } else {
    showElements();
    handleOpenModal();
  }

  if (StanPaneluSterowania.state === "deleting") {
    hideFormElements([fullDataForm, ...[...Array.from(editingElements), ...Array.from(addingElements)]]);
    showFormElements(deletingElements);
  } else if (StanPaneluSterowania.state === "editing") {
    hideFormElements([fullDataForm, ...[...Array.from(deletingElements), ...Array.from(addingElements)]]);
    showFormElements(editingElements);
  } else if (StanPaneluSterowania.state === "adding") {
    hideFormElements([searchForm, ...[...Array.from(deletingElements), ...Array.from(editingElements)]]);
    showFormElements(addingElements);
  } else {
    hideFormElements([
      searchForm,
      ...[...Array.from(deletingElements), ...Array.from(editingElements), ...Array.from(addingElements)],
    ]);
    handleCloseModal();
    hideFilteredTable();
    cleanPelneDane();
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("/api/kontrahenci/");
    const data = await response.json();
    populateTable(data);

    worker.postMessage({ topic: "initialize", payload: data });
  } catch (error) {
    console.error("Error during fetch or data handling:", error);
    populateTable(kontrahenciData);

    worker.postMessage({ topic: "initialize", payload: kontrahenciData });
  }
});

const kontrahenciTable = "kontrahenciTable";
const filteredKontrahenciTable = "filteredKontrahenciTable";

function populateTable(data, id = kontrahenciTable, interactive = false) {
  const tbody = document.getElementById(id).getElementsByTagName("tbody")[0];
  if (!data || data.length === 0) {
    tbody.innerHTML = "<p>Brak danych</p>";
    return;
  }
  data.forEach((kontrahent) => {
    const tr = document.createElement("tr");
    tr.id = `${id}-${kontrahent.nip}`;
    const values = [
      kontrahent.nip,
      kontrahent.regon,
      kontrahent.nazwa,
      !!(typeof kontrahent.czy_platnik_vat === "string"
        ? parseInt(kontrahent.czy_platnik_vat)
        : kontrahent.czy_platnik_vat),
      kontrahent.ulica,
      kontrahent.numer_domu,
      kontrahent.numer_mieszkania,
    ];
    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = typeof value === "boolean" ? (value ? "Tak" : "Nie") : value;
      tr.appendChild(td);
    });

    if (interactive) {
      const td = document.createElement("td");
      const button = document.createElement("button");

      if (StanPaneluSterowania.state === possibleStates.editing) {
        button.textContent = "Edytuj";
        button.addEventListener("click", () => {
          setupEditPelneDane(kontrahent);
        });
      } else if (StanPaneluSterowania.state === possibleStates.deleting) {
        button.textContent = "Usuń";
        button.addEventListener("click", () => {
          deleteKontrahent(kontrahent);
        });
      }
      td.appendChild(button);
      tr.appendChild(td);
    }

    tbody.appendChild(tr);
  });
}

// O ile lepsze byłoby wyszukiwanie w DB, to ciekawiej będzie to zrobić w js na potrzeby tego projektu, chociaż te wszystkie mechaniki w js spowodowały że brakło mi czasu na porządne errory i ich łagodne lądowanie
function wyszukajKontrahenta() {
  const { nip, regon, nazwa } = getWyszukajDane();

  worker.postMessage({ topic: "find", payload: { nip, regon, nazwa } });
}

async function wykonajAkcjeNaKontrahencie() {
  if (StanPaneluSterowania.state === possibleStates.editing) {
    updateKontrahent();
  } else if (StanPaneluSterowania.state === possibleStates.deleting) {
    deleteKontrahent();
  } else if (StanPaneluSterowania.state === possibleStates.adding) {
    await insertKontrahent();
  }

  updateState(possibleStates.idle);
}

function updateFilteredTable(data) {
  const tableId = filteredKontrahenciTable;
  const tbody = document.getElementById(tableId).getElementsByTagName("tbody")[0];
  tbody.innerHTML = "";
  populateTable(data, tableId, true);
}

async function insertKontrahent() {
  const data = getPelneDane();
  if (data) {
    // DB
    const result = await handleDbInsert(data);
    // JS
    if (result) {
      populateTable([data]);
      updateState(possibleStates.idle);
      worker.postMessage({
        topic: "add",
        payload: data,
      });
    }
  } else {
    alert("Wypełnij wszystkie pola (numer_mieszkania opcjonalnie)");
  }
}
async function updateKontrahent(data = {}) {
  const fullData = { ...getPelneDane(), ...data };
  if (fullData) {
    // DB
    const result = await handleDbUpdate(fullData, fullData.originalNip);
    // JS
    if (result) {
      updateTableRecord(fullData.originalNip, fullData);
      updateState(possibleStates.idle);
      worker.postMessage({
        topic: "update",
        payload: fullData,
      });
    }
  } else {
    alert("Wypełnij wszystkie pola (numer_mieszkania opcjonalnie)");
  }
}

function deleteKontrahent(data = {}) {
  const { nip, regon } = { ...getWyszukajDane(), ...data };
  if (nip) {
    // DB
    const result = handleDbDelete(nip);
    // JS
    if (result) {
      deleteTableRecord(nip);
      updateState(possibleStates.idle);
      worker.postMessage({
        topic: "delete",
        payload: { nip, regon },
      });
    }
  } else {
    alert("Nie znaleziono kontrahenta");
  }
}

const pelneDaneFields = [
  "originalNip",
  "nip",
  "regon",
  "nazwa",
  "czy_platnik_vat",
  "ulica",
  "numer_domu",
  "numer_mieszkania",
];

function getPelneDane() {
  const pelneDane = document.getElementById("pełneDane");
  const data = {};

  pelneDaneFields.forEach((field) => {
    const element = pelneDane.querySelector(`[name=${field}]`);
    if (element.type === "checkbox") {
      data[field] = element.checked;
    } else {
      data[field] = element.value;
    }
  });

  return data;
}

function setupEditPelneDane(data) {
  const wyszukajKontrahentaElement = document.getElementById("wyszukajKontrahenta");
  const pelneDane = document.getElementById("pełneDane");

  pelneDaneFields.forEach((field) => {
    const element = pelneDane.querySelector(`[name=${field}]`);
    if (element.type === "checkbox") {
      element.checked =
        typeof data[field] === "boolean" ? data[field] : data[field].toLowerCase() === "tak" ? true : false;
    } else if (field === pelneDaneFields[0]) {
      element.value = data[pelneDaneFields[1]];
    } else {
      element.value = data[field];
    }
  });

  updateState(possibleStates.editing);

  pelneDane.classList.remove("hidden");
  wyszukajKontrahentaElement.classList.add("hidden");
}

function cleanPelneDane() {
  const pelneDane = document.getElementById("pełneDane");

  pelneDaneFields.forEach((field) => {
    const element = pelneDane.querySelector(`[name=${field}]`);
    if (element.type === "checkbox") {
      element.checked = false;
    } else {
      element.value = "";
    }
  });
}

function getWyszukajDane() {
  const wyszukajKontrahentaForm = document.getElementById("wyszukajKontrahenta");
  const nip = wyszukajKontrahentaForm.querySelector("[name=nip]")?.value;
  const regon = wyszukajKontrahentaForm.querySelector("[name=regon]")?.value;
  const nazwa = wyszukajKontrahentaForm.querySelector("[name=nazwa]")?.value;

  return {
    nip: nip,
    regon: regon,
    nazwa: nazwa,
  };
}

function updateTableRecord(nip, data) {
  const rowToBeUpdated = findRowByNip(kontrahenciTable, nip);
  if (rowToBeUpdated) {
    rowToBeUpdated.children[0].textContent = data.nip;
    rowToBeUpdated.children[1].textContent = data.regon;
    rowToBeUpdated.children[2].textContent = data.nazwa;
    rowToBeUpdated.children[3].textContent =
      typeof data.czy_platnik_vat === "boolean"
        ? data.czy_platnik_vat
        : data.czy_platnik_vat.toLowerCase() === "tak"
        ? "Tak"
        : "Nie";
    rowToBeUpdated.children[4].textContent = data.ulica;
    rowToBeUpdated.children[5].textContent = data.numer_domu;
    rowToBeUpdated.children[6].textContent = data.numer_mieszkania;
  }
  rowToBeUpdated.id = `${kontrahenciTable}-${data.nip}`;
}

function deleteTableRecord(nip) {
  const tableBody = document.getElementById(kontrahenciTable).getElementsByTagName("tbody")[0];
  const rowToBeUpdated = findRowByNip(kontrahenciTable, nip);
  if (rowToBeUpdated) tableBody.removeChild(rowToBeUpdated);
}

function findRowByNip(tableId, nip) {
  const rowToBeUpdated = document.getElementById(`${tableId}-${nip}`);
  return rowToBeUpdated;
}

function hideFilteredTable() {
  const filteredKontrahenciTableElement = document.getElementById(filteredKontrahenciTable);
  filteredKontrahenciTableElement.classList.add("hidden");
  filteredKontrahenciTableElement.getElementsByTagName("tbody")[0].innerHTML = "";
}

function showFilteredTable() {
  const filteredKontrahenciTableElement = document.getElementById(filteredKontrahenciTable);
  filteredKontrahenciTableElement.classList.remove("hidden");
}

function handleOpenModal() {
  const dialog = document.getElementsByTagName("dialog")[0];
  dialog.open = true;
}

function handleCloseModal() {
  const dialog = document.getElementsByTagName("dialog")[0];
  dialog.close();
}

async function handleDbInsert(kontrahent) {
  const url = "/api/kontrahenci/";
  if (validateKontrahent(kontrahent)) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(kontrahent),
    });
    try {
      return await handleResponse(response);
    } catch (error) {
      console.log(error);
      return undefined;
    }
  } else {
    alert("Wypełnij wszystkie pola (numer_mieszkania opcjonalnie)!");
  }
}

async function handleDbUpdate(kontrahent, ogNip) {
  const url = `/api/kontrahenci/?nip=${ogNip}`;
  if (validateKontrahent(kontrahent)) {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(kontrahent),
    });
    try {
      return await handleResponse(response);
    } catch (error) {
      console.log(error);
      return undefined;
    }
  } else {
    alert("Wypełnij wszystkie pola (numer_mieszkania opcjonalnie)!");
  }
}

async function handleDbDelete(nip) {
  const url = `/api/kontrahenci/?nip=${nip}`;
  const response = await fetch(url, {
    method: "DELETE",
  });
  try {
    return await handleResponse(response);
  } catch (error) {
    console.log(error);
    return undefined;
  }
}
async function handleResponse(response) {
  if (response.ok) {
    if (response.headers.get("Content-Type")?.includes("application/json")) {
      return response.json();
    }
    return response.text();
  } else {
    const errorData = await response.json();
    alert(errorData.error || "Unknown error");
    throw new Error(errorData.error || "Unknown error");
  }
}

function validateKontrahent(kontrahent) {
  if (!kontrahent) {
    return false;
  }

  return (
    kontrahent.nip &&
    kontrahent.regon &&
    kontrahent.nazwa &&
    kontrahent.czy_platnik_vat !== undefined &&
    kontrahent.ulica &&
    kontrahent.numer_domu &&
    kontrahent.numer_mieszkania !== undefined
  );
}
