<template>
  <div class="page">
    <h2 class="title">📤 Sorties de stock</h2>

    <!-- 🧾 INFOS VENTE -->
    <div class="card form">
      <input v-model="clientName" placeholder="Nom du client (optionnel)" />
      <textarea v-model="remark" placeholder="Remarque / Observation" rows="2" />
    </div>

    <!-- ➕ AJOUT PRODUIT -->
    <div class="card form">
      <select v-model="productId">
        <option disabled value="">-- Produit --</option>
        <option v-for="p in products" :key="p.id" :value="p.id">
          {{ p.name }} ({{ p.price }} FCFA)
        </option>
      </select>

      <input v-model.number="qty" type="number" min="1" placeholder="Qté" />
      <button class="btn" @click="addToCart">Ajouter</button>
    </div>

    <!-- 🛒 PANIER -->
    <!-- 🛒 PANIER -->
    <div v-if="cart.length" class="card">
      <h3>Produits de la sortie</h3>

      <div class="cart-item" v-for="i in cart" :key="i.productId">
        <div>
          <strong>{{ i.name }}</strong>
          <div class="meta">
            {{ i.qty }} × {{ i.price }} FCFA
          </div>
        </div>

        <button class="danger" @click="removeFromCart(i.productId)">❌</button>
      </div>

      <div class="total">
        Total : <strong>{{ cartTotal }} FCFA</strong>
      </div>

      <button class="btn primary full" @click="saveSale" :disabled="loading">
        <span class="loading-indicator" v-if="loading"></span>
        <span v-else>Valider & Imprimer</span>
      </button>
    </div>


    <!-- 📋 HISTORIQUE -->
    <div class="card">
      <h3>Historique des sorties</h3>

      <transition-group name="list" tag="div">
        <div v-for="s in paginatedSales" :key="s.id" class="entry" :class="{ selected: openedSale === s.id }"
          @click="openModal(s)">
          <div>
            <strong>{{ formatDate(s.date) }}</strong>
            <div class="meta">
              👤 {{ s.clientName || "Client comptant" }}
              <span class="badge">{{ s.items.length }} produits</span>
            </div>
          </div>

          <button class="danger" @click.stop="deleteSale(s)">
            Supprimer
          </button>
        </div>
      </transition-group>

      <!-- Pagination -->
      <div class="pagination" v-if="sales.length > pageSize">
        <button @click="prevPage" :disabled="currentPage === 1">⬅️</button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="currentPage === totalPages">➡️</button>
      </div>
    </div>

    <!-- 🔽 MODAL -->
    <div v-if="modalSale" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>Détails vente</h3>

        <p><strong>Date :</strong> {{ formatDate(modalSale.date) }}</p>
        <p><strong>Client :</strong> {{ modalSale.clientName }}</p>

        <p v-if="modalSale.remark">
          <strong>Remarque :</strong> {{ modalSale.remark }}
        </p>

        <hr />

        <div v-for="i in modalSale.items" :key="i.productId">
          • {{ i.name }} — {{ i.qty }} × {{ i.price }} FCFA
        </div>

        <hr />
        <strong>Total : {{ modalSale.total }} FCFA</strong>

        <button class="btn primary" @click="closeModal">Fermer</button>
      </div>
    </div>
  </div>
</template>


<script>
import { db } from "../firebase"
import { printInvoiceDirect } from "../utils/invoice"
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc
} from "firebase/firestore"

export default {
  data() {
    return {
      products: [],
      sales: [],
      cart: [],
      productId: "",
      qty: 1,
      loading: false,
      depotId: "J5x1X8Cw10ErpwYM0Oyn",

      clientName: "",
      remark: "",

      modalSale: null,
      openedSale: null,

      currentPage: 1,
      pageSize: 5
    }
  },

  computed: {
    cartTotal() {
      return this.cart.reduce((s, i) => s + i.qty * i.price, 0)
    },
    totalPages() {
      return Math.ceil(this.sales.length / this.pageSize)
    },
    paginatedSales() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.sales.slice(start, start + this.pageSize)
    }
  },

  methods: {
    async load() {
      const p = await getDocs(collection(db, "products"))
      this.products = p.docs.map(d => ({ id: d.id, ...d.data() }))
      this.loadSales()
    },

    async loadSales() {
      const snap = await getDocs(collection(db, "sales"))
      this.sales = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => b.date.seconds - a.date.seconds)
    },

    addToCart() {
      const p = this.products.find(x => x.id === this.productId)
      if (!p) return

      this.cart.push({
        productId: p.id,
        name: p.name,
        price: p.price,
        qty: this.qty
      })

      this.productId = ""
      this.qty = 1
    },

    removeFromCart(id) {
      this.cart = this.cart.filter(i => i.productId !== id)
    },

    async saveSale() {
      this.loading = true;
      if (!this.cart.length) return

      for (const i of this.cart) {
        const p = this.products.find(x => x.id === i.productId)
        const current = p.stocks?.[this.depotId] || 0

        if (current < i.qty) {
          alert(`Stock insuffisant pour ${i.name}`)
          this.loading = false;
          return
        }

        await updateDoc(doc(db, "products", p.id), {
          [`stocks.${this.depotId}`]: current - i.qty
        })
        this.loading = false;
      }

      const sale = {
        depotId: this.depotId,
        items: this.cart,
        clientName: this.clientName || "Client comptant",
        remark: this.remark || "",
        total: this.cartTotal,
        date: new Date()
      }
      this.loading = false;
      const ref = await addDoc(collection(db, "sales"), sale)

      await printInvoiceDirect(
        { id: ref.id, total: sale.total },
        sale.items,
        sale.clientName,
        { name: "Dépôt principal" }
      )

      this.cart = []
      this.clientName = ""
      this.remark = ""
      this.loadSales()
    },

    async deleteSale(sale) {
      if (!confirm("Supprimer cette vente ?")) return

      for (const i of sale.items) {
        const p = this.products.find(x => x.id === i.productId)
        const current = p.stocks?.[sale.depotId] || 0

        await updateDoc(doc(db, "products", p.id), {
          [`stocks.${sale.depotId}`]: current + i.qty
        })
      }

      await deleteDoc(doc(db, "sales", sale.id))
      this.loadSales()
    },

    openModal(sale) {
      this.modalSale = sale
      this.openedSale = sale.id
    },

    closeModal() {
      this.modalSale = null
      this.openedSale = null
    },

    prevPage() {
      if (this.currentPage > 1) this.currentPage--
    },
    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++
    },

    formatDate(date) {
      return new Date(
        date.seconds ? date.seconds * 1000 : date
      ).toLocaleDateString("fr-FR")
    }
  },

  mounted() {
    this.load()
  }
}
</script>


<style scoped>
/* ===== PAGE ===== */
.page {
  max-width: 1000px;
  margin: auto;
  padding: 16px;
}

.title {
  margin-bottom: 16px;
  text-align: center;
  font-size: clamp(1.3rem, 4vw, 1.8rem);
}

/* ===== CARD ===== */
.card {
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* ===== FORM ===== */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

select,
input,
textarea {
  /* padding: 10px; */
  border-radius: 8px;
  border: 1px solid #ccc;
  width: 100%;
  padding: 10px 0;
  font-size: 1rem;
}

/* ===== BOUTONS ===== */
.btn {
  padding: 10px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  background: #ddd;
  font-size: 1rem;
}

.primary {
  background: #3b82f6;
  color: white;
}

.danger {
  background: #ef4444;
  color: white;
  border-radius: 6px;
  padding: 6px 10px;
  border: none;
}

.full {
  width: 100%;
  margin-top: 12px;
}

/* ===== PANIER ===== */
.cart-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.cart-item .meta {
  font-size: 0.9rem;
  color: #555;
}

.total {
  text-align: right;
  margin-top: 10px;
  font-size: 1.05rem;
}

/* ===== HISTORIQUE ===== */
.entry {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.entry button {
  align-self: flex-end;
}

.entry.selected {
  background: #e0f2fe;
}

.meta {
  font-size: 0.85rem;
  color: #555;
}

.badge {
  background: #3b82f6;
  color: white;
  padding: 3px 8px;
  border-radius: 10px;
  font-size: 0.75rem;
  margin-left: 8px;
}

/* ===== PAGINATION ===== */
.pagination {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 10px;
}

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
}

/* ===== LOADING ===== */
.loading-indicator {
  display: flex;
  justify-content: center;
}

.loading-indicator::after {
  content: "";
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 3px solid #06283D;
  border-top-color: #F2994A;
  border-bottom-color: #F2994A;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ===== TABLETTE & + ===== */
@media (min-width: 768px) {
  .form {
    flex-direction: row;
  }

  .form select,
  .form input,
  .form textarea {
    flex: 1;
  }

  .form .btn {
    width: auto;
  }

  .entry {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

</style>
