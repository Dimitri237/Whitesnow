<template>
  <div>
    <h2>Fournisseurs</h2>

    <div class="card">
      <input v-model="name" placeholder="Nom" />
      <input v-model="phone" placeholder="Téléphone" />
      <input v-model="address" placeholder="Adresse" />
      <button class="btn" @click="add">Ajouter</button>
    </div>

    <div v-for="s in suppliers" :key="s.id" class="card">
      {{ s.name }} — {{ s.phone }} — {{ s.address }}
      <button class="btn" @click="remove(s.id)">Supprimer</button>
    </div>
  </div>
</template>

<script>
import { db } from "../firebase"
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "firebase/firestore"

export default {
  data() {
    return {
      suppliers: [],
      name: "",
      phone: "",
      address: ""
    }
  },
  methods: {
    async load() {
      const snap = await getDocs(collection(db, "suppliers"))
      this.suppliers = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    },
    async add() {
      await addDoc(collection(db, "suppliers"), {
        name: this.name,
        phone: this.phone,
        address: this.address
      })
      this.name = ""
      this.phone = ""
      this.address = ""
      this.load()
    },
    async remove(id) {
      if (!confirm("Supprimer ce fournisseur ?")) return
      await deleteDoc(doc(db, "suppliers", id))
      this.load()
    }
  },
  
  mounted() {
    this.load()
  }
}
</script>
