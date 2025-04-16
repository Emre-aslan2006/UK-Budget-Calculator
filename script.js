window.onload = function () {
  const baseCategories = ["Rent", "Food", "Utilities", "Transportation", "Entertainment", "Unplanned"];
  let customCategories = [];

  function getAllCategories() {
    return [...baseCategories, ...customCategories];
  }

  function saveFormData() {
    const data = {
      salary: document.getElementById("budgetInput").value,
      debt: document.getElementById("Debt").value,
      custom: customCategories.map(cat => ({
        name: cat,
        value: document.getElementById(cat).value
      })),
    };
    getAllCategories().forEach(cat => data[cat] = document.getElementById(cat).value);
    localStorage.setItem("budgetData", JSON.stringify(data));
  }

  function loadFormData() {
    const data = JSON.parse(localStorage.getItem("budgetData"));
    if (!data) return;
    document.getElementById("budgetInput").value = data.salary;
    document.getElementById("Debt").value = data.debt || "";

    if (data.custom) {
      data.custom.forEach(cat => addCustomCategory(cat.name, cat.value));
    }

    getAllCategories().forEach(cat => {
      if (data[cat]) document.getElementById(cat).value = data[cat];
    });
  }

  function addCustomCategory(name = "", value = "") {
    if (!name || document.getElementById(name)) return;

    const container = document.getElementById("customFields");
    const label = document.createElement("label");
    label.innerHTML = `${name} £ <input type="number" id="${name}" class="expense" value="${value}" />`;
    container.appendChild(label);

    customCategories.push(name);
  }

  document.getElementById("addCustom").addEventListener("click", () => {
    const name = document.getElementById("customName").value.trim();
    if (name) {
      addCustomCategory(name);
      document.getElementById("customName").value = "";
    }
  });

  document.getElementById("darkModeToggle").addEventListener("change", e => {
    document.body.classList.toggle("dark", e.target.checked);
  });

  document.getElementById("startOver").addEventListener("click", () => {
    document.querySelectorAll("input").forEach(input => {
      if (input.type !== "checkbox") input.value = "";
    });
    document.getElementById("results").innerHTML = "";
    document.getElementById("monthlyResults").innerHTML = "";
    localStorage.removeItem("budgetData");
    document.getElementById("customFields").innerHTML = "";
    customCategories = [];
  });

  document.getElementById("calculateBtn").addEventListener("click", () => {
    let salary = parseFloat(document.getElementById("budgetInput").value) || 0;
    let debtMonthly = parseFloat(document.getElementById("Debt").value) || 0;
    let debt = debtMonthly * 12;

    const results = document.getElementById("results");
    const monthlyResults = document.getElementById("monthlyResults");
    results.innerHTML = "";
    monthlyResults.innerHTML = "";

    const allCats = getAllCategories();
    let userSpending = 0;
    let valid = true;
    const values = {};

    allCats.forEach(cat => {
      const input = document.getElementById(cat);
      const val = input.value.trim();
      if (val === "") {
        input.classList.add("error");
        valid = false;
      } else {
        input.classList.remove("error");
        values[cat] = parseFloat(val);
        userSpending += values[cat];
      }
    });

    if (!valid) {
      results.innerHTML = `<div class="result-item" style="color:red;">⚠️ Fill in all fields</div>`;
      return;
    }

    saveFormData();

    function taxUK(income) {
      let tax = 0;
      if (income <= 12570) return 0;
      if (income <= 50270) tax += (income - 12570) * 0.20;
      else if (income <= 125140) {
        tax += (50270 - 12570) * 0.20;
        tax += (income - 50270) * 0.40;
      } else {
        tax += (50270 - 12570) * 0.20;
        tax += (125140 - 50270) * 0.40;
        tax += (income - 125140) * 0.45;
      }
      return tax;
    }

    function niUK(income) {
      let ni = 0;
      if (income <= 12570) return 0;
      if (income <= 50270) ni += (income - 12570) * 0.12;
      else {
        ni += (50270 - 12570) * 0.12;
        ni += (income - 50270) * 0.02;
      }
      return ni;
    }

    const tax = taxUK(salary);
    const ni = niUK(salary);
    const savings = salary - tax - ni - userSpending - debt;

    if (savings < 0) {
      results.innerHTML = `<div class="result-item" style="color:red;">⚠️ Overspent. Adjust your values.</div>`;
      return;
    }

    // Annual
    results.innerHTML += `<h3>📅 Annual Plan</h3>`;
    results.innerHTML += `<div class="result-item"><strong>Salary</strong><span>£${salary.toFixed(2)}</span></div>`;
    results.innerHTML += `<div class="result-item"><strong>Tax</strong><span>£${tax.toFixed(2)}</span></div>`;
    results.innerHTML += `<div class="result-item"><strong>NI</strong><span>£${ni.toFixed(2)}</span></div>`;
    if (debt > 0) results.innerHTML += `<div class="result-item"><strong>Debt</strong><span>£${debt.toFixed(2)}</span></div>`;

    allCats.forEach(cat => {
      const percent = ((values[cat] / salary) * 100).toFixed(1);
      results.innerHTML += `<div class="result-item"><span>${cat} (${percent}%)</span><span>£${values[cat].toFixed(2)}</span></div>`;
    });

    results.innerHTML += `<div class="result-item" style="background:#dff0d8;"><strong>Savings</strong><span>£${savings.toFixed(2)}</span></div>`;

    // Monthly
    monthlyResults.innerHTML += `<h3>📆 Monthly Plan</h3>`;
    monthlyResults.innerHTML += `<div class="result-item"><span>Salary</span><span>£${(salary / 12).toFixed(2)}</span></div>`;
    monthlyResults.innerHTML += `<div class="result-item"><span>Tax</span><span>£${(tax / 12).toFixed(2)}</span></div>`;
    monthlyResults.innerHTML += `<div class="result-item"><span>NI</span><span>£${(ni / 12).toFixed(2)}</span></div>`;
    if (debt > 0) monthlyResults.innerHTML += `<div class="result-item"><span>Debt</span><span>£${(debt / 12).toFixed(2)}</span></div>`;

    allCats.forEach(cat => {
      monthlyResults.innerHTML += `<div class="result-item"><span>${cat}</span><span>£${(values[cat] / 12).toFixed(2)}</span></div>`;
    });

    monthlyResults.innerHTML += `<div class="result-item" style="background:#dff0d8;"><strong>Savings</strong><span>£${(savings / 12).toFixed(2)}</span></div>`;
  });

  document.getElementById("exportCSV").addEventListener("click", () => {
    let csv = "Category,Amount\n";
    document.querySelectorAll(".result-item").forEach(div => {
      const parts = div.innerText.split('£');
      if (parts.length === 2) {
        csv += `${parts[0].trim()},${parts[1].trim()}\n`;
      }
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "budget.csv";
    link.click();
  });

  loadFormData();
};
