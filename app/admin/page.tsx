"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = "produits";

const CATEGORIES = ["Sandwich/Burger", "Accompagnement", "Boisson", "Dessert"];

export default function AdminDashboard() {
  // --- SYSTÈME D'ONGLETS ---
  const [ongletActif, setOngletActif] = useState<"commandes" | "menu" | "livreurs">("commandes");

  // --- ÉTATS COMMANDES ---
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(true);
  const [livreurSelectionne, setLivreurSelectionne] = useState<{ [key: number]: string }>({});

  // --- ÉTATS LIVREURS ---
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [chargementLivreurs, setChargementLivreurs] = useState(true);
  const [nomLivreur, setNomLivreur] = useState("");
  const [telLivreur, setTelLivreur] = useState("");
  const [messageLivreur, setMessageLivreur] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- ÉTATS MENU (PRODUITS) ---
  const [produits, setProduits] = useState<any[]>([]);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [categorie, setCategorie] = useState(CATEGORIES[0]);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messageMenu, setMessageMenu] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingProduit, setEditingProduit] = useState<any | null>(null);

  // Charger toutes les données au démarrage
  useEffect(() => {
    fetchCommandes();
    fetchProduits();
    fetchLivreurs();
  }, []);

  // --- FONCTIONS COMMANDES ---
  async function fetchCommandes() {
    setChargementCommandes(true);
    const { data, error } = await supabase.from("commandes").select("*").order("id", { ascending: false });
    if (error) {
      console.error("Erreur fetchCommandes:", error.message);
    } else {
      setCommandes(data || []);
    }
    setChargementCommandes(false);
  }

  async function modifierStatutCommande(id: number, nouveauStatut: string) {
    const { error } = await supabase.from("commandes").update({ statut: nouveauStatut }).eq("id", id);
    if (error) {
      alert("Erreur mise à jour statut : " + error.message);
    } else {
      fetchCommandes();
    }
  }

  async function attribuerLivreur(commandeId: number) {
    const livreurIdStr = livreurSelectionne[commandeId];

    if (!livreurIdStr || livreurIdStr === "") {
      alert("Veuillez sélectionner un livreur valide dans la liste !");
      return;
    }

    // On récupère le livreur choisi directement depuis le state "livreurs"
    // plutôt que de reconvertir l'id en nombre à l'aveugle : ça évite les
    // soucis si l'id est un uuid/text côté Supabase et pas un entier.
    const livreurChoisi = livreurs.find((l) => String(l.id) === String(livreurIdStr));

    if (!livreurChoisi) {
      alert("Erreur : le livreur sélectionné est introuvable. Rafraîchissez la page et réessayez.");
      return;
    }

    const { error } = await supabase
      .from("commandes")
      .update({
        livreur_id: livreurChoisi.id,
        statut: "en route",
      })
      .eq("id", commandeId);

    if (!error) {
      fetchCommandes();
    } else {
      alert("Erreur lors de l'attribution : " + error.message);
    }
  }

  // --- FONCTIONS LIVREURS ---
  async function fetchLivreurs() {
    setChargementLivreurs(true);
    const { data, error } = await supabase.from("livreurs").select("*").order("nom");
    if (error) {
      console.error("Erreur fetchLivreurs:", error.message);
      setMessageLivreur({ type: "error", text: "❌ Impossible de charger les livreurs : " + error.message });
    } else {
      setLivreurs(data || []);
    }
    setChargementLivreurs(false);
  }

  async function handleAjouterLivreur(e: React.FormEvent) {
    e.preventDefault();
    setMessageLivreur(null);

    const { error } = await supabase
      .from("livreurs")
      .insert([{ nom: nomLivreur, telephone: telLivreur }]);

    if (!error) {
      setMessageLivreur({ type: "success", text: "Livreur ajouté avec succès !" });
      setNomLivreur("");
      setTelLivreur("");
      fetchLivreurs();
    } else {
      setMessageLivreur({ type: "error", text: "❌ Erreur : " + error.message });
    }
  }

  async function handleSupprimerLivreur(id: number, nom: string) {
    if (!window.confirm(`Supprimer le livreur ${nom} ?`)) return;
    const { error } = await supabase.from("livreurs").delete().eq("id", id);
    if (!error) {
      fetchLivreurs();
    } else {
      alert("Erreur suppression livreur : " + error.message);
    }
  }

  // --- FONCTIONS MENU ---
  async function fetchProduits() {
    const { data, error } = await supabase.from("produits").select("*").order("id", { ascending: false });
    if (error) {
      console.error("Erreur fetchProduits:", error.message);
    } else {
      setProduits(data || []);
    }
  }

  const chargerFormulairePourModification = (produit: any) => {
    setEditingProduit(produit);
    setTitre(produit.titre || produit.nom || "");
    setDescription(produit.description || "");
    setPrix(produit.prix?.toString() || "");
    setCategorie(produit.categorie || CATEGORIES[0]);
    setImageUrl(produit.image_url || "");
    setImageFile(null);
    setMessageMenu(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annulerModification = () => {
    setEditingProduit(null);
    setTitre("");
    setDescription("");
    setPrix("");
    setImageUrl("");
    setCategorie(CATEGORIES[0]);
    setImageFile(null);
    setMessageMenu(null);
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessageMenu(null);

    try {
      let finalImageUrl = imageUrl;

      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, imageFile, { cacheControl: "3600", upsert: false });
        if (uploadError) throw new Error(`Erreur image : ${uploadError.message}`);

        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const donneesProduit = {
        nom: titre,
        titre: titre,
        description: description,
        prix: parseFloat(prix),
        categorie: categorie,
        image_url: finalImageUrl,
      };

      if (editingProduit) {
        const { error } = await supabase.from("produits").update(donneesProduit).eq("id", editingProduit.id);
        if (error) throw error;
        setMessageMenu({ type: "success", text: "🔄 Produit mis à jour !" });
      } else {
        const { error } = await supabase.from("produits").insert([donneesProduit]);
        if (error) throw error;
        setMessageMenu({ type: "success", text: "✅ Produit ajouté au menu !" });
      }

      annulerModification();
      fetchProduits();
    } catch (error: any) {
      setMessageMenu({ type: "error", text: "❌ " + error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSupprimerProduit = async (id: number, nomProduit: string) => {
    if (!window.confirm(`Supprimer "${nomProduit}" ?`)) return;
    const { error } = await supabase.from("produits").delete().eq("id", id);
    if (!error) {
      setMessageMenu({ type: "success", text: "🗑️ Produit supprimé." });
      fetchProduits();
    } else {
      setMessageMenu({ type: "error", text: "❌ Erreur suppression : " + error.message });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold uppercase tracking-wide">
            Panel Admin - <span className="text-red-600">Food Plus</span>
          </h1>
          <div className="h-1 w-24 bg-red-600 mt-3 rounded-full mx-auto"></div>
        </div>

        {/* ONGLETS NAV */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 border-b border-zinc-800 pb-4">
          <button
            onClick={() => setOngletActif("commandes")}
            className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${
              ongletActif === "commandes" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"
            }`}
          >
            📦 Commandes ({commandes.length})
          </button>
          <button
            onClick={() => setOngletActif("menu")}
            className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${
              ongletActif === "menu" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"
            }`}
          >
            🍔 Gestion du Menu
          </button>
          <button
            onClick={() => setOngletActif("livreurs")}
            className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${
              ongletActif === "livreurs" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"
            }`}
          >
            🛵 Livreurs ({livreurs.length})
          </button>
        </div>

        {/* ONGLET 1 : LES COMMANDES */}
        {ongletActif === "commandes" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold uppercase tracking-wider text-gray-300">Suivi des commandes</h2>
              <button onClick={fetchCommandes} className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold py-2 px-4 rounded-lg uppercase">
                🔄 Rafraîchir
              </button>
            </div>

            {chargementCommandes ? (
              <div className="text-center py-12 text-gray-500 animate-pulse">Chargement...</div>
            ) : commandes.length === 0 ? (
              <p className="text-gray-500 text-center py-12">Aucune commande pour le moment.</p>
            ) : (
              <div className="space-y-4">
                {commandes.map((cmd) => {
                  const livreurAttribue = livreurs.find((l) => String(l.id) === String(cmd.livreur_id));

                  return (
                    <div
                      key={cmd.id}
                      className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1 grow w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs bg-zinc-800 text-gray-400 px-2 py-1 rounded font-mono">#{cmd.id}</span>
                          <h3 className="font-bold text-lg text-white">{cmd.nom_client}</h3>
                          <span
                            className={`text-xs uppercase font-extrabold px-2 py-1 rounded ${
                              cmd.statut === "en attente"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : cmd.statut === "en cours"
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                : cmd.statut === "en route"
                                ? "bg-purple-500/10 text-purple-500 border border-purple-500/20"
                                : "bg-green-500/10 text-green-500 border border-green-500/20"
                            }`}
                          >
                            {cmd.statut === "en route" && livreurAttribue ? `En route (${livreurAttribue.nom})` : cmd.statut}
                          </span>
                        </div>
                        <p className="text-sm text-red-500 font-bold">📞 {cmd.telephone_client || cmd.telephone}</p>
                        <p className="text-sm text-gray-400">📍 {cmd.adresse || cmd.adresse_livraison}</p>
                        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 mt-2">
                          <p className="text-sm text-gray-300 font-medium">
                            <span className="text-gray-500">Articles :</span> {cmd.details_commande}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                        <div className="text-right w-full md:w-auto flex md:block justify-between items-center">
                          <span className="text-xs text-gray-500 uppercase">Total</span>
                          <span className="text-2xl font-black text-red-500 block">{cmd.total} DA</span>
                        </div>

                        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full justify-end items-center">
                          {cmd.statut === "en attente" && (
                            <button
                              onClick={() => modifierStatutCommande(cmd.id, "en cours")}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase w-full md:w-auto"
                            >
                              👨‍🍳 Préparer
                            </button>
                          )}

                          {cmd.statut === "en cours" && (
                            <div className="flex gap-1 w-full md:w-auto">
                              {chargementLivreurs ? (
                                <span className="text-xs text-gray-500 py-2 px-2">Chargement livreurs...</span>
                              ) : livreurs.length === 0 ? (
                                <span className="text-xs text-red-500 py-2 px-2">Aucun livreur disponible</span>
                              ) : (
                                <select
                                  value={livreurSelectionne[cmd.id] || ""}
                                  onChange={(e) => setLivreurSelectionne({ ...livreurSelectionne, [cmd.id]: e.target.value })}
                                  className="bg-zinc-900 border border-zinc-800 text-xs font-bold p-2 rounded-lg text-white outline-none cursor-pointer"
                                >
                                  <option value="" className="bg-white text-black">
                                    -- Sélectionner Livreur --
                                  </option>
                                  {livreurs.map((l, index) => (
                                    <option key={l.id ?? index} value={l.id != null ? String(l.id) : ""} className="bg-white text-black">
                                      {l.nom}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <button
                                onClick={() => attribuerLivreur(cmd.id)}
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-3 rounded-lg uppercase whitespace-nowrap"
                              >
                                🚀 Confier
                              </button>
                            </div>
                          )}

                          {cmd.statut === "en route" && (
                            <button
                              onClick={() => modifierStatutCommande(cmd.id, "livré")}
                              className="bg-green-600/20 text-green-500 border border-green-500/30 text-xs font-bold py-2 px-3 rounded-lg uppercase hover:bg-green-600 hover:text-white transition-colors"
                            >
                              Forcer Livré
                            </button>
                          )}

                          <button
                            onClick={async () => {
                              if (window.confirm("Supprimer la commande ?")) {
                                const { error } = await supabase.from("commandes").delete().eq("id", cmd.id);
                                if (error) {
                                  alert("Erreur suppression commande : " + error.message);
                                } else {
                                  fetchCommandes();
                                }
                              }
                            }}
                            className="bg-zinc-900 hover:bg-red-600/20 hover:text-red-500 text-gray-500 text-xs font-bold p-2 rounded-lg"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ONGLET 2 : LA GESTION DU MENU */}
        {ongletActif === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire menu */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit sticky top-6">
              <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase tracking-wider">
                {editingProduit ? "🔄 Modifier" : "✨ Ajouter"}
              </h2>
              {messageMenu && (
                <div
                  className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${
                    messageMenu.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"
                  }`}
                >
                  {messageMenu.text}
                </div>
              )}
              <form onSubmit={handleMenuSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Nom</label>
                  <input
                    type="text"
                    required
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Catégorie</label>
                  <select
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-white text-black">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Prix (DA)</label>
                  <input
                    type="number"
                    required
                    value={prix}
                    onChange={(e) => setPrix(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-red-600 file:text-white"
                  />
                </div>
                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg uppercase tracking-wide text-sm"
                  >
                    {uploading ? "Traitement..." : editingProduit ? "💾 Enregistrer" : "➕ Ajouter"}
                  </button>
                  {editingProduit && (
                    <button
                      type="button"
                      onClick={annulerModification}
                      className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold py-2 rounded-lg uppercase text-xs"
                    >
                      ❌ Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Liste produits ordonnés par catégorie */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-wider text-gray-300">📋 Ton Menu</h2>
              {produits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun produit dans le menu.</p>
              ) : (
                <div className="space-y-10">
                  {CATEGORIES.map((cat) => {
                    const produitsDeLaCategorie = produits.filter((p) => (p.categorie || CATEGORIES[0]) === cat);
                    if (produitsDeLaCategorie.length === 0) return null;
                    return (
                      <div key={cat}>
                        <h3 className="text-xl font-bold text-red-500 border-b border-zinc-800 pb-2 mb-4 uppercase tracking-widest">{cat}</h3>
                        <div className="space-y-3">
                          {produitsDeLaCategorie.map((produit) => (
                            <div
                              key={produit.id}
                              className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                            >
                              <div className="flex items-center gap-4">
                                {produit.image_url && (
                                  <img
                                    src={produit.image_url}
                                    alt={produit.titre}
                                    className="w-12 h-12 object-cover rounded-lg bg-zinc-900 border border-zinc-800 shrink-0"
                                  />
                                )}
                                <div>
                                  <h4 className="font-bold text-white">{produit.titre || produit.nom}</h4>
                                  <p className="text-sm text-red-500 font-bold">{produit.prix} DA</p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => chargerFormulairePourModification(produit)}
                                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-3 rounded-lg"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleSupprimerProduit(produit.id, produit.titre || produit.nom)}
                                  className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-xs font-bold py-2 px-3 rounded-lg border border-red-600/20"
                                >
                                  🗑️
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET 3 : GESTION DES LIVREURS */}
        {ongletActif === "livreurs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Formulaire ajout livreur */}
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase tracking-wider">🎯 Recruter un Livreur</h2>

              {messageLivreur && (
                <div
                  className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${
                    messageLivreur.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"
                  }`}
                >
                  {messageLivreur.text}
                </div>
              )}

              <form onSubmit={handleAjouterLivreur} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Nom complet</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Karim Ben"
                    value={nomLivreur}
                    onChange={(e) => setNomLivreur(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">N° Téléphone</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: 0661 22 33 44"
                    value={telLivreur}
                    onChange={(e) => setTelLivreur(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg uppercase text-sm tracking-wide transition-colors"
                >
                  ➕ Ajouter le livreur
                </button>
              </form>
            </div>

            {/* Liste des livreurs */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 uppercase tracking-wider text-gray-300">👥 Livreurs Actifs ({livreurs.length})</h2>
              {chargementLivreurs ? (
                <div className="text-center py-12 text-gray-500 animate-pulse">Chargement...</div>
              ) : livreurs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun livreur dans l'équipe pour l'instant.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {livreurs.map((livreur, index) => (
                    <div
                      key={livreur.id || index}
                      className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center group hover:border-zinc-700 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-lg uppercase text-white">🛵 {livreur.nom}</h4>
                        <p className="text-sm text-gray-400 font-mono mt-0.5">📞 {livreur.telephone}</p>
                      </div>
                      <button
                        onClick={() => handleSupprimerLivreur(livreur.id, livreur.nom)}
                        className="bg-zinc-900 border border-zinc-800 hover:bg-red-600/10 hover:text-red-500 text-gray-400 text-xs p-2 rounded-lg transition-colors"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}