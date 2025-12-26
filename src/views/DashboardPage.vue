<template>
  <div class="page">
    <h1 class="title">📊 Dashboard</h1>

    <div class="cards">
      <div class="card highlight">
        💰 Total ventes : {{ totalSales.toLocaleString("fr-FR") }} FCFA
      </div>
    </div>

    <div class="card chart-card">
      <h3>Ventes</h3>
      <div class="chart-wrapper">
        <canvas id="salesChart"></canvas>
      </div>
    </div>
  </div>
</template>


<script>
import Chart from "chart.js/auto"
import { db } from "../firebase"
import { collection, getDocs } from "firebase/firestore"

export default {
  data() {
    return {
      totalSales: 0,
      totalEntries: 0,
      products: [],
      entries: []
    }
  },
  async mounted() {
    // Charger les ventes
    const salesSnap = await getDocs(collection(db, "sales"))
    const sales = salesSnap.docs.map(s => ({ id: s.id, ...s.data() }))
    this.totalSales = sales.reduce((acc, s) => acc + s.total || 0, 0)

    // Charger les produits
    const prodSnap = await getDocs(collection(db, "products"))
    this.products = prodSnap.docs.map(p => ({ id: p.id, ...p.data() }))

    // Charger les entrées
    const entriesSnap = await getDocs(collection(db, "entries"))
    this.entries = entriesSnap.docs.map(e => ({ id: e.id, ...e.data() }))

    // Total des entrées (quantité totale ajoutée)
    this.totalEntries = this.entries.reduce((acc, entry) => {
      const sum = entry.items
        ? entry.items.reduce((a, i) => a + (i.qty || 0), 0)
        : 0
      return acc + sum
    }, 0)

    // Graphique ventes
    new Chart(document.getElementById("salesChart"), {
      type: "bar",
      data: {
        labels: ["Ventes totales"],
        datasets: [{
          label: "FCFA",
          data: [this.totalSales],
          backgroundColor: "rgb(214,106,5)"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        }
      }

    })
  }
}
</script>

<style scoped>
.page {
  max-width: 1000px;
  margin: auto;
  padding: 16px;
}

.title {
  margin-bottom: 16px;
  font-size: clamp(1.4rem, 4vw, 2rem);
  text-align: center;
}

.cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.card {
  background: #fff;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  width: 100%;
}

.highlight {
  font-size: clamp(1rem, 4vw, 1.3rem);
  font-weight: bold;
  text-align: center;
}

/* Graphique */
.chart-card {
  margin-top: 20px;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 260px;
}

/* Tablette */
@media (min-width: 768px) {
  .cards {
    flex-direction: row;
  }

  .card {
    flex: 1;
  }

  .chart-wrapper {
    height: 320px;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .page {
    padding: 24px;
  }

  .chart-wrapper {
    height: 380px;
  }
}
</style>
