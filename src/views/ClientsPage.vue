<template>
  <div>
    <h2>Clients</h2>

    <div class="card">
      <input v-model="name" placeholder="Nom" />
      <input v-model="phone" placeholder="Téléphone" />
      <button class="btn" @click="add">Ajouter</button>
    </div>

    <div v-for="c in clients" :key="c.id" class="card">
      {{ c.name }} — {{ c.phone }}
      <button class="btn" @click="remove(c.id)">Supprimer</button>
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
      clients: [],
      name: "",
      phone: ""
    }
  },
  methods: {
    async load() {
      const snap = await getDocs(collection(db, "clients"))
      this.clients = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    },
    async add() {
      await addDoc(collection(db, "clients"), {
        name: this.name,
        phone: this.phone
      })
      this.name = ""
      this.phone = ""
      this.load()
    },
    async remove(id) {
      if (!confirm("Supprimer ce client ?")) return
      await deleteDoc(doc(db, "clients", id))
      this.load()
    }
  },
  mounted() {
    this.load()
  }
}
</script>
