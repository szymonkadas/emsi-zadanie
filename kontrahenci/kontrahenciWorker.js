let dataByNip = new Map();
let dataByRegon = new Map();
let allKontrahenci = [];

self.onmessage = function (e) {
  switch (e.data.topic) {
    case "initialize":
      e.data.payload.forEach((kontrahent) => {
        dataByNip.set(kontrahent.nip, kontrahent);
        dataByRegon.set(kontrahent.regon, kontrahent);
      });
      allKontrahenci = [...e.data.payload];
      self.postMessage({ topic: "dataInitialized" });
      break;

    case "find":
      const matches = [];
      if (e.data.payload.nip) {
        const kontrahent = dataByNip.get(e.data.payload.nip);
        kontrahent && matches.push(kontrahent);
      }
      if (matches.length === 0 && e.data.payload.regon) {
        const kontrahent = dataByRegon.get(e.data.payload.regon);
        kontrahent && matches.push(kontrahent);
      }
      if (matches.length === 0 && e.data.payload.nazwa) {
        allKontrahenci.forEach((kontrahent) => {
          if (kontrahent.nazwa.toLowerCase().startsWith(e.data.payload.nazwa.toLowerCase())) {
            matches.push(kontrahent);
          }
        });
      }
      self.postMessage({ topic: "result", results: matches });
      break;

    case "add":
      const newKontrahent = e.data.payload;
      if (newKontrahent && newKontrahent.nip) {
        if (dataByNip.get(newKontrahent.nip))
          return self.postMessage({ topic: "addError", status: "error", message: "Nip already exists." });
        dataByNip.set(newKontrahent.nip, newKontrahent);
        dataByRegon.set(newKontrahent.regon, newKontrahent);
        allKontrahenci.push(newKontrahent);
        self.postMessage({ topic: "added", status: "success", added: newKontrahent });
      } else {
        self.postMessage({ topic: "addError", status: "error", message: "Invalid or missing data for add." });
      }
      break;

    case "update":
      const updatedKontrahent = e.data.payload;
      if (updatedKontrahent && updatedKontrahent.nip) {
        const originalRegon = dataByNip.get(updatedKontrahent.originalNip)?.regon;
        dataByNip.delete(updatedKontrahent.originalNip);
        if (originalRegon && originalRegon !== updatedKontrahent.regon) dataByRegon.delete(originalRegon);
        dataByNip.set(updatedKontrahent.nip, updatedKontrahent);
        dataByRegon.set(updatedKontrahent.regon, updatedKontrahent);
        allKontrahenci = allKontrahenci.map((kontrahent) =>
          kontrahent.nip === updatedKontrahent.nip ? updatedKontrahent : kontrahent
        );
        self.postMessage({ topic: "updated", status: "success", updated: updatedKontrahent });
      } else {
        self.postMessage({ topic: "updateError", status: "error", message: "Invalid or missing data for update." });
      }
      break;

    case "delete":
      const deletedKontrahent = e.data.payload;
      if (deletedKontrahent && deletedKontrahent.nip) {
        dataByNip.delete(deletedKontrahent.nip);
        dataByRegon.delete(deletedKontrahent.regon);
        allKontrahenci = allKontrahenci.filter((kontrahent) => kontrahent.nip !== deletedKontrahent.nip);
        self.postMessage({ topic: "deleted", status: "success", deleted: deletedKontrahent });
      } else {
        self.postMessage({ topic: "deleteError", status: "error", message: "Invalid or missing data for delete." });
      }
      break;
    default:
      console.error("Unknown topic", e.data.topic);
  }
};
