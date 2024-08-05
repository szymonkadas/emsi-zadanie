document.addEventListener("DOMContentLoaded", async function () {
  try {
    const response = await fetch("/api/delegacje/");
    const data = await response.json();
    populateTable(data);
  } catch (error) {
    console.error("Error during fetch or data handling:", error);
  }
});

function populateTable(data) {
  const tbody = document.getElementById("delegacjeTable").getElementsByTagName("tbody")[0];
  data.forEach((delegacja) => {
    const tr = document.createElement("tr");
    const values = [
      delegacja.lp,
      `${delegacja.imie} ${delegacja.nazwisko}`,
      delegacja.data_od,
      delegacja.data_do,
      delegacja.miejsce_wyjazdu,
      delegacja.miejsce_przyjazdu,
    ];

    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}
