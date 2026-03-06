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

    // 🔥 TRI DU PLUS RECENT AU PLUS ANCIEN
    return Object.keys(groups)
      .sort((a, b) => new Date(b) - new Date(a))
      .reduce((acc, key) => {
        acc[key] = groups[key]
        return acc
      }, {})
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

  doc.setFontSize(18)
  doc.text("JOURNAL DES SORTIES", 105, 20, { align: "center" })

  doc.setFontSize(11)
  doc.text(`Date : ${this.formatDisplayDate(date)}`, 14, 35)

  const rows = group.sales.map(sale => ([
    sale.clientName || "Non renseigné",
    sale.items.length,
    this.formatMoney(sale.total)
  ]))

  autoTable(doc, {
    startY: 45,
    head: [["Client", "Produits", "Montant"]],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 10
    },
    headStyles: {
      fillColor: [33, 150, 243]
    }
  })

  doc.setFontSize(12)
  doc.text(
    `TOTAL DU JOUR : ${this.formatMoney(group.total)}`,
    14,
    doc.lastAutoTable.finalY + 15
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
  padding: 35px 25px;
  background: #f1f5f9;
  min-height: 100vh;
}

/* ===== HEADER ===== */
.header {
  margin-bottom: 35px;
}

.header h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 6px;
  color: #0f172a;
}

.subtitle {
  color: #64748b;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
}

/* ===== DAY CARD ===== */
.day-card {
  background: white;
  padding: 22px;
  margin-bottom: 25px;
  border-radius: 18px;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.05);
  border: 1px solid #e2e8f0;
  transition: all 0.25s ease;
}

.day-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

/* ===== TOP SECTION ===== */
.day-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
}

.day-top h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
}

/* ===== BADGE ===== */
.badge {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 5px 12px;
  border-radius: 25px;
  font-size: 0.75rem;
  font-weight: 600;
}

/* ===== RIGHT ===== */
.right {
  display: flex;
  align-items: center;
  gap: 18px;
}

/* ===== DAY TOTAL ===== */
.day-total {
  font-size: 1.3rem;
  font-weight: 800;
  color: #15803d;
  background: #dcfce7;
  padding: 6px 14px;
  border-radius: 10px;
}

/* ===== PDF BUTTON ===== */
.pdf-btn {
  background: linear-gradient(135deg, #2563eb, #1e40af);
  color: white;
  border: none;
  padding: 9px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.pdf-btn:hover {
  transform: scale(1.06);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
}

/* ===== TABLE ===== */
.table {
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
}

/* HEADER TABLE */
.table-header,
.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 12px 0;
  align-items: center;
}

.table-header {
  font-weight: 700;
  font-size: 0.8rem;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ROWS */
.table-row {
  font-size: 0.95rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.2s ease;
}

.table-row:hover {
  background: #f8fafc;
}

.table-row:last-child {
  border-bottom: none;
}

/* AMOUNT */
.amount {
  font-weight: 700;
  color: #166534;
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
    gap: 12px;
  }

  .right {
    width: 100%;
    justify-content: space-between;
  }

}

</style>