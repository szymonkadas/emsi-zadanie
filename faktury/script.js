document.addEventListener("DOMContentLoaded", function () {
  populateTable();
});

function calculateVAT(kwota, vat) {
  return kwota * (parseInt(vat) / 100);
}

function populateTable() {
  const tbody = document.getElementById("fakturyTable").getElementsByTagName("tbody")[0];
  data.forEach((item) => {
    const tr = document.createElement("tr");
    const fields = ["id", "opis", "mpk", "kwota", "ilosc", "vat", "kwotaBrutto", "wartoscNetto", "wartoscBrutto"];
    const values = [
      item.id,
      item.opis,
      item.mpk,
      item.kwota.toFixed(2) + " zł",
      item.ilosc,
      item.vat,
      (item.kwota + calculateVAT(item.kwota, item.vat)).toFixed(2) + " zł",
      (item.kwota * item.ilosc).toFixed(2) + " zł",
      ((item.kwota + calculateVAT(item.kwota, item.vat)) * item.ilosc).toFixed(2) + " zł",
    ];

    fields.forEach((_field, index) => {
      const td = document.createElement("td");
      td.textContent = values[index];
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

class ColorState {
  constructor() {
    this.state = false;
  }
  toggleState() {
    this.state = !this.state;
  }
}

const colorStateInstance = new ColorState();

function highlightExpensiveItems() {
  colorStateInstance.toggleState();
  const rows = document.getElementById("fakturyTable").getElementsByTagName("tr");
  for (let i = 1; i < rows.length; i++) {
    const netAmount = parseFloat(rows[i].cells[3].textContent.replace(" zł", ""));
    if (netAmount > 1000) {
      rows[i].style.backgroundColor = colorStateInstance.state ? "green" : "";
      rows[i].style.color = colorStateInstance.state ? "#fff" : "";
    }
  }
}

const data = [
  { id: 1, opis: "Produkt 1", mpk: "123", kwota: 100, ilosc: 10, vat: "23%" },
  { id: 2, opis: "Produkt 2", mpk: "124", kwota: 1100, ilosc: 5, vat: "23%" },
  { id: 3, opis: "Produkt 3", mpk: "125", kwota: 550, ilosc: 15, vat: "8%" },
  { id: 4, opis: "Produkt 4", mpk: "126", kwota: 850, ilosc: 20, vat: "3%" },
  { id: 5, opis: "Produkt 5", mpk: "127", kwota: 2300, ilosc: 30, vat: "0%" },
];
