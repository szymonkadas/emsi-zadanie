const table = document.getElementById("employeesTableBody");
document.addEventListener("DOMContentLoaded", function () {
  populateTable();
});

function populateTable() {
  pracownicy.forEach((pracownik, index) => {
    const row = table.insertRow(-1);
    Object.values(pracownik).forEach((text) => {
      const cell = row.insertCell(-1);
      cell.textContent = text;
    });
    row.style.backgroundColor =
      index % 2 === 0 ? document.getElementById("color1").value : document.getElementById("color2").value;
  });
}

function changeColors() {
  const rows = table.rows;
  for (let i = 1; i < rows.length; i++) {
    rows[i].style.backgroundColor =
      i % 2 === 0 ? document.getElementById("color1").value : document.getElementById("color2").value;
  }
}

const pracownicy = [
  {
    lp: 1,
    imie: "Jan",
    nazwisko: "Kowalski",
    stanowisko: "Developer",
    dataZatrudnienia: "2020-01-05",
    iloscDniUrlopowych: 20,
  },
  {
    lp: 2,
    imie: "Anna",
    nazwisko: "Nowak",
    stanowisko: "Designer",
    dataZatrudnienia: "2019-08-12",
    iloscDniUrlopowych: 15,
  },
  {
    lp: 3,
    imie: "Marcin",
    nazwisko: "Borowiec",
    stanowisko: "Project Manager",
    dataZatrudnienia: "2021-03-22",
    iloscDniUrlopowych: 10,
  },
  {
    lp: 4,
    imie: "Ewa",
    nazwisko: "Maj",
    stanowisko: "Tester",
    dataZatrudnienia: "2018-05-16",
    iloscDniUrlopowych: 18,
  },
  {
    lp: 5,
    imie: "Adam",
    nazwisko: "Janiak",
    stanowisko: "DevOps Engineer",
    dataZatrudnienia: "2017-12-11",
    iloscDniUrlopowych: 25,
  },
];
