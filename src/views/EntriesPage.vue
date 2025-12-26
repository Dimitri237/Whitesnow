<template>
  <div class="page">
    <h2 class="title">📥 Entrées de stock</h2>

    <!-- ➕ AJOUT AU PANIER -->
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
    <div v-if="cart.length" class="card">
      <h3>Produits de l’entrée</h3>

      <div class="cart-item" v-for="i in cart" :key="i.productId">
        <div>
          <strong>{{ i.name }}</strong>
          <div class="qty">Qté : {{ i.qty }}</div>
        </div>
        <button class="danger" @click="removeFromCart(i.productId)">❌</button>
      </div>

      <button class="btn primary full" @click="saveEntry" :disabled="loading">
        <span class="loading-indicator" v-if="loading"></span>
        <span v-else>Valider l’entrée</span>
      </button>
    </div>

    <!-- 📋 HISTORIQUE -->
    <div class="card">
      <h3>Historique des entrées</h3>

      <transition-group name="list" tag="div">
        <div v-for="e in paginatedEntries" :key="e.id" class="entry" :class="{ selected: openedEntry === e.id }"
          @click="openModal(e)">
          <div>
            <strong>Entrée du {{ formatDate(e.date) }}</strong>
            <span class="badge">{{ e.items?.length || 0 }} produits</span>
          </div>
          <button class="danger" @click.stop="deleteEntry(e)">Supprimer</button>
        </div>
      </transition-group>

      <!-- Pagination -->
      <div class="pagination" v-if="entries.length > pageSize">
        <button :disabled="currentPage === 1" @click="prevPage">⬅️</button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="nextPage">➡️</button>
      </div>
    </div>

    <!-- 🔽 MODAL DÉTAIL -->
    <div v-if="modalEntry" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <h3>Détails Entrée du {{ formatDate(modalEntry.date) }}</h3>
        <div v-for="item in modalEntry.items" :key="item.productId" class="detail-line">
          • {{ item.name }} — {{ item.qty }}
        </div>
        <button class="btn primary" @click="closeModal">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from "../firebase";
import { collection, getDocs, doc, updateDoc, addDoc, deleteDoc } from "firebase/firestore";

export default {
  data() {
    return {
      products: [],
      entries: [],
      cart: [],
      productId: "",
      qty: 1,
      loading: false,
      depotId: "J5x1X8Cw10ErpwYM0Oyn",
      openedEntry: null,
      modalEntry: null,
      currentPage: 1,
      pageSize: 5
    };
  },

  computed: {
    totalPages() {
      return Math.ceil(this.entries.length / this.pageSize);
    },
    paginatedEntries() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.entries.slice(start, start + this.pageSize);
    }
  },

  methods: {
    async load() {
      const p = await getDocs(collection(db, "products"));
      this.products = p.docs.map(d => ({ id: d.id, ...d.data() }));
      this.loadEntries();
    },

    async loadEntries() {
      const snap = await getDocs(collection(db, "entries"));
      this.entries = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.date - a.date);
    },

    addToCart() {
      const p = this.products.find(x => x.id === this.productId);
      if (!p) return;
      this.cart.push({ productId: p.id, name: p.name, price: p.price, qty: this.qty });
      this.qty = 1;
      this.productId = "";
    },

    removeFromCart(id) {
      this.cart = this.cart.filter(i => i.productId !== id);
    },

    async saveEntry() {
      this.loading = true;
      for (const i of this.cart) {
        const p = this.products.find(x => x.id === i.productId);
        const current = p.stocks?.[this.depotId] || 0;
        await updateDoc(doc(db, "products", p.id), { [`stocks.${this.depotId}`]: current + i.qty });
      }
      await addDoc(collection(db, "entries"), { depotId: this.depotId, items: this.cart, date: new Date() });
      this.cart = [];
      this.loading = false;
      this.loadEntries();
    },

    async deleteEntry(entry) {
      if (!confirm("Supprimer cette entrée ?")) return;
      for (const i of entry.items) {
        const p = this.products.find(x => x.id === i.productId);
        const current = p.stocks?.[entry.depotId] || 0;
        await updateDoc(doc(db, "products", p.id), { [`stocks.${entry.depotId}`]: current - i.qty });
      }
      await deleteDoc(doc(db, "entries", entry.id));
      this.loadEntries();
    },

    openModal(entry) {
      this.modalEntry = entry;
      this.openedEntry = entry.id;
    },
    closeModal() {
      this.modalEntry = null;
      this.openedEntry = null;
    },

    prevPage() { if (this.currentPage > 1) this.currentPage--; },
    nextPage() { if (this.currentPage < this.totalPages) this.currentPage++; },

    formatDate(date) {
      return new Date(date.seconds ? date.seconds * 1000 : date).toLocaleDateString("fr-FR");
    }
  },

  mounted() {
    this.load();
  }
};
</script>

<style scoped>
/* ===== BASE ===== */
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

.card {
  background: #fff;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* ===== FORMULAIRE ===== */
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

select,
input {
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
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
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

.qty {
  font-size: 0.9rem;
  color: #555;
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

.detail-line {
  margin: 6px 0;
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

/* ===== TABLETTE ===== */
@media (min-width: 768px) {
  .form {
    flex-direction: row;
    align-items: center;
  }

  .form select,
  .form input {
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
