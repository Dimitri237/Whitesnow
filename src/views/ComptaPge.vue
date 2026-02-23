<template>
  <div class="page">

    <div class="header">
      <h1>📊 Comptabilité</h1>
      <p class="subtitle">Journal des sorties journalières</p>
    </div>

    <div v-for="(group, date) in groupedSales"
         :key="date"
         class="day-card">

      <!-- HEADER JOUR -->
      <div class="day-top">
        <div>
          <h3>{{ formatDisplayDate(date) }}</h3>
          <span class="badge">
            {{ group.sales.length }} ventes
          </span>
        </div>

        <div class="right">
          <div class="day-total">
            {{ formatMoney(group.total) }}
          </div>

          <button class="pdf-btn"
                  @click="downloadPDF(date, group)">
            📄 Export PDF
          </button>
        </div>
      </div>

      <!-- TABLE -->
      <div class="table">

        <div class="table-header">
          <span>Client</span>
          <span>Produits</span>
          <span>Total</span>
        </div>

        <div v-for="sale in group.sales"
             :key="sale.id"
             class="table-row">

          <span>{{ sale.clientName }}</span>
          <span>{{ sale.items.length }}</span>
          <span class="amount">
            {{ formatMoney(sale.total) }}
          </span>
        </div>

      </div>
    </div>

  </div>
</template>
<script>
import { db } from "../firebase"
import { collection, getDocs } from "firebase/firestore"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default {
  data() {
    return {
      sales: []
    }
  },

  computed: {
    groupedSales() {
      const groups = {}

      this.sales.forEach(sale => {
        const date = this.formatDateKey(sale.date)

        if (!groups[date]) {
          groups[date] = {
            sales: [],
            total: 0
          }
        }

        groups[date].sales.push(sale)
        groups[date].total += sale.total
      })

      return groups
    }
  },

  methods: {
    async loadSales() {
      const snap = await getDocs(collection(db, "sales"))
      this.sales = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }))
    },

    formatDateKey(date) {
      const d = date.seconds
        ? new Date(date.seconds * 1000)
        : new Date(date)

      return d.toISOString().split("T")[0] // 2026-02-23
    },
formatMoney(amount) {
  return new Intl.NumberFormat("fr-FR").format(amount) + " FCFA"
},
    formatDisplayDate(dateString) {
      return new Date(dateString)
        .toLocaleDateString("fr-FR", {
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric"
        })
    },

    downloadPDF(date, group) {

      const doc = new jsPDF()

      doc.setFontSize(16)
      doc.text("Journal des sorties", 14, 20)

      doc.setFontSize(12)
      doc.text(`Date : ${this.formatDisplayDate(date)}`, 14, 30)

      const rows = []

      group.sales.forEach(sale => {
        rows.push([
          sale.clientName,
          sale.items.length,
          sale.total + " FCFA"
        ])
      })

      autoTable(doc, {
        startY: 40,
        head: [["Client", "Nb Produits", "Total"]],
        body: rows
      })

      doc.text(
        `Total du jour : ${group.total} FCFA`,
        14,
        doc.lastAutoTable.finalY + 10
      )

      doc.save(`journal-${date}.pdf`)
    }
  },

  mounted() {
    this.loadSales()
  }
}
</script>
<style scoped>

/* ===== PAGE ===== */
.page {
  max-width: 1100px;
  margin: auto;
  padding: 30px 20px;
  background: #f8fafc;
  min-height: 100vh;
}

/* ===== HEADER ===== */
.header {
  margin-bottom: 30px;
}

.header h1 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 5px;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
}

/* ===== DAY CARD ===== */
.day-card {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: 0.2s ease;
}

.day-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.08);
}

/* ===== TOP SECTION ===== */
.day-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.badge {
  background: #e0f2fe;
  color: #0369a1;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  margin-left: 10px;
}

/* ===== RIGHT ===== */
.right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.day-total {
  font-size: 1.2rem;
  font-weight: 700;
  color: #16a34a;
}

/* ===== PDF BUTTON ===== */
.pdf-btn {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: 0.2s;
}

.pdf-btn:hover {
  transform: scale(1.05);
}

/* ===== TABLE ===== */
.table {
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 10px 0;
}

.table-header {
  font-weight: 600;
  font-size: 0.85rem;
  color: #64748b;
}

.table-row {
  font-size: 0.95rem;
  border-bottom: 1px solid #f1f5f9;
}

.table-row:last-child {
  border-bottom: none;
}

.amount {
  font-weight: 600;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {

  .table-header,
  .table-row {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .table-header span:nth-child(2),
  .table-row span:nth-child(2) {
    display: none;
  }

  .day-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

}

</style>