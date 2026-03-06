<template>
  <div class="page">

    <div class="header">
      <h1>📊 Tableau de bord</h1>
      <p class="subtitle">Vue globale de votre activité</p>
    </div>

    <!-- KPI -->
    <div class="cards">

      <div class="card kpi primary">
        <div class="kpi-title">💰 Chiffre d'affaires total</div>
        <div class="kpi-value">
          {{ formatMoney(totalSales) }}
        </div>
      </div>

      <div class="card kpi blue">
        <div class="kpi-title">📅 Mois actuel</div>
        <div class="kpi-value">
          {{ formatMoney(currentMonthSales) }}
        </div>
      </div>

      <div class="card kpi gray">
        <div class="kpi-title">📊 Mois précédent</div>
        <div class="kpi-value">
          {{ formatMoney(previousMonthSales) }}
        </div>
      </div>

      <div class="card kpi growth" :class="{ positive: growthRate >= 0, negative: growthRate < 0 }">
        <div class="kpi-title">📉 Croissance</div>
        <div class="kpi-value">
          {{ growthRate.toFixed(1) }} %
        </div>
      </div>

      <div class="card kpi green">
        <div class="kpi-title">📦 Produits</div>
        <div class="kpi-value">
          {{ products.length }}
        </div>
      </div>

      <div class="card kpi orange">
        <div class="kpi-title">📥 Quantité entrée stock</div>
        <div class="kpi-value">
          {{ totalEntries }}
        </div>
      </div>

      <div class="card kpi purple">
        <div class="kpi-title">🧾 Nombre de ventes</div>
        <div class="kpi-value">
          {{ sales.length }}
        </div>
      </div>

    </div>

    <!-- ALERT STOCK -->
    <div v-if="lowStockProducts.length" class="card alert-card">
      <h3>🔔 Produits en stock faible</h3>

      <div v-for="product in lowStockProducts" :key="product.id" class="alert-row">
        {{ product.name }} —
        <strong>{{ product.stock }} restant(s)</strong>
      </div>
    </div>

    <!-- CHART -->
    <div class="card chart-card">
      <div class="chart-header">
        <h3>📈 Évolution mensuelle des ventes</h3>
      </div>
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
      entries: [],
      sales: [],
      currentMonthSales: 0,
      previousMonthSales: 0,
      growthRate: 0,
      lowStockProducts: []
    }
  },

  methods: {
    formatMoney(amount) {
      return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
    }
  },

  async mounted() {

    // SALES
    const salesSnap = await getDocs(collection(db, "sales"))
    this.sales = salesSnap.docs.map(s => ({ id: s.id, ...s.data() }))

    this.totalSales = this.sales.reduce(
      (acc, s) => acc + (s.total || 0),
      0
    )

    // PRODUITS
    const prodSnap = await getDocs(collection(db, "products"))
    this.products = prodSnap.docs.map(p => ({ id: p.id, ...p.data() }))

    // ALERTES STOCK
    const LOW_STOCK_THRESHOLD = 5
    this.lowStockProducts = this.products.filter(
      p => (p.stock || 0) <= LOW_STOCK_THRESHOLD
    )

    // ENTRIES
    const entriesSnap = await getDocs(collection(db, "entries"))
    this.entries = entriesSnap.docs.map(e => ({ id: e.id, ...e.data() }))

    this.totalEntries = this.entries.reduce((acc, entry) => {
      const sum = entry.items
        ? entry.items.reduce((a, i) => a + (i.qty || 0), 0)
        : 0
      return acc + sum
    }, 0)

    // 📊 Comparaison mensuelle
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    let currentTotal = 0
    let previousTotal = 0

    this.sales.forEach(s => {
      if (!s.date) return

      const d = new Date(
        s.date.seconds
          ? s.date.seconds * 1000
          : s.date
      )

      if (d.getFullYear() === currentYear) {

        if (d.getMonth() === currentMonth) {
          currentTotal += s.total || 0
        }

        if (d.getMonth() === currentMonth - 1) {
          previousTotal += s.total || 0
        }
      }
    })

    this.currentMonthSales = currentTotal
    this.previousMonthSales = previousTotal

    if (previousTotal > 0) {
      this.growthRate =
        ((currentTotal - previousTotal) / previousTotal) * 100
    } else {
      this.growthRate = currentTotal > 0 ? 100 : 0
    }

    // 📈 Graphique mensuel
    const monthlyData = {}

    this.sales.forEach(s => {
      if (!s.date) return

      const d = new Date(
        s.date.seconds
          ? s.date.seconds * 1000
          : s.date
      )

      const label = d.toLocaleDateString("fr-FR", {
        month: "short",
        year: "numeric"
      })

      if (!monthlyData[label]) monthlyData[label] = 0
      monthlyData[label] += s.total || 0
    })

    new Chart(document.getElementById("salesChart"), {
      type: "line",
      data: {
        labels: Object.keys(monthlyData),
        datasets: [{
          label: "Ventes (FCFA)",
          data: Object.values(monthlyData),
          borderColor: "#2563eb",
          backgroundColor: "rgba(37,99,235,0.1)",
          fill: true,
          tension: 0.4
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
  max-width: 1200px;
  margin: auto;
  padding: 30px;
  background: #f1f5f9;
  min-height: 100vh;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.card {
  background: white;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 10px 25px rgba(15, 23, 42, 0.06);
  transition: 0.25s;
}

.card:hover {
  transform: translateY(-4px);
}

.kpi-title {
  font-size: 0.85rem;
  color: #64748b;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 1.6rem;
  font-weight: 800;
}

/* COLORS */
.primary {
  border-left: 5px solid #2563eb;
}

.green {
  border-left: 5px solid #16a34a;
}

.orange {
  border-left: 5px solid #f97316;
}

.purple {
  border-left: 5px solid #9333ea;
}

.blue {
  border-left: 5px solid #0ea5e9;
}

.gray {
  border-left: 5px solid #64748b;
}

.growth.positive {
  border-left: 5px solid #16a34a;
}

.growth.negative {
  border-left: 5px solid #dc2626;
}

/* ALERT */
.alert-card {
  margin-bottom: 30px;
  background: #fff7ed;
  border-left: 5px solid #f97316;
}

.alert-row {
  padding: 8px 0;
  border-bottom: 1px solid #fde68a;
}

.alert-row:last-child {
  border-bottom: none;
}

.chart-wrapper {
  position: relative;
  height: 380px;
}
</style>