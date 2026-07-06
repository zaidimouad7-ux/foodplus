"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = "produits"; 

export default function AdminDashboard() {
  // --- SÉCURITÉ ADMIN ---
  const [estAdminAuthentifie, setEstAdminAuthentifie] = useState(false);
  const [saisieCodeAdmin, setSaisieCodeAdmin] = useState("");

  // AJOUT DE L'ONGLET CATEGORIES
  const [ongletActif, setOngletActif] = useState<"commandes" | "menu" | "livreurs" | "categories">("commandes");

  // --- ÉTATS COMMANDES ---
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(true);
  const [livreurSelectionne, setLivreurSelectionne] = useState<{ [key: number]: string }>({});

  // --- ÉTATS LIVREURS ---
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [nomLivreur, setNomLivreur] = useState("");
  const [telLivreur, setTelLivreur] = useState("");
  const [passLivreur, setPassLivreur] = useState("");
  const [modifPassLivreur, setModifPassLivreur] = useState<{ [key: number]: string }>({});
  const [messageLivreur, setMessageLivreur] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- ÉTATS DYNAMIQUES DES CATÉGORIES ---
  const [categories, setCategories] = useState<any[]>([]);
  const [nomNouvelleCategorie, setNomNouvelleCategorie] = useState("");
  const [messageCategorie, setMessageCategorie] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // --- ÉTATS MENU (PRODUITS & SUPPLÉMENTS) ---
  const [produits, setProduits] = useState<any[]>([]);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [categorieSelected, setCategorieSelected] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [supplements, setSupplements] = useState<{nom: string, prix: number}[]>([]);
  const [suppNom, setSuppNom] = useState("");
  const [suppPrix, setSuppPrix] = useState("");

  const [uploading, setUploading] = useState(false);
  const [messageMenu, setMessageMenu] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingProduit, setEditingProduit] = useState<any | null>(null);

  useEffect(() => {
    if (localStorage.getItem("adminAuth") === "true") {
      setEstAdminAuthentifie(true);
    }
  }, []);

  useEffect(() => {
    if (estAdminAuthentifie) {
      fetchCommandes();
      fetchCategories();
      fetchProduits();
      fetchLivreurs();
    }
  }, [estAdminAuthentifie]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (saisieCodeAdmin === "admin123") {
      setEstAdminAuthentifie(true);
      localStorage.setItem("adminAuth", "true");
    } else {
      alert("❌ Code administrateur incorrect !");
    }
  };

  // --- FONCTIONS CATÉGORIES DYNAMIQUES ---
  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true });
    if (!error && data) {
      setCategories(data);
      if (data.length > 0 && !categorieSelected) {
        setCategorieSelected(data[0].nom);
      }
    }
  }

  async function handleAjouterCategorie(e: React.FormEvent) {
    e.preventDefault();
    setMessageCategorie(null);
    if (!nomNouvelleCategorie.trim()) return;

    const { error } = await supabase.from("categories").insert([{ nom: nomNouvelleCategorie.trim() }]);
    if (!error) {
      setMessageCategorie({ type: "success", text: "Catégorie ajoutée avec succès !" });
      setNomNouvelleCategorie("");
      fetchCategories();
    } else {
      setMessageCategorie({ type: "error", text: "Erreur : " + error.message });
    }
  }

  async function handleSupprimerCategorie(id: number, nom: string) {
    if (!window.confirm(`Supprimer la catégorie "${nom}" ? Cela ne supprimera pas les produits mais ils n'auront plus de catégorie attribuée.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) {
      fetchCategories();
    }
  }

  // --- FONCTIONS COMMANDES ---
  async function fetchCommandes() {
    setChargementCommandes(true);
    const { data, error } = await supabase.from("commandes").select("*").order("id", { ascending: false });
    if (!error) setCommandes(data || []);
    setChargementCommandes(false);
  }

  async function modifierStatutCommande(id: number, nouveauStatut: string) {
    const { error } = await supabase.from("commandes").update({ statut: nouveauStatut }).eq("id", id);
    if (!error) fetchCommandes();
  }

  async function attribuerLivreur(commandeId: number) {
    const livreurIdStr = livreurSelectionne[commandeId];
    if (!livreurIdStr || livreurIdStr === "") return alert("Veuillez sélectionner un livreur valide !");
    const idLivreurFormate = parseInt(livreurIdStr, 10);
    if (isNaN(idLivreurFormate)) return alert("Erreur d'identifiant livreur.");
    const { error } = await supabase.from("commandes").update({ livreur_id: idLivreurFormate, statut: "en route" }).eq("id", commandeId);
    if (!error) fetchCommandes();
  }

  // --- FONCTIONS LIVREURS ---
  async function fetchLivreurs() {
    const { data, error } = await supabase.from("livreurs").select("*").order("nom");
    if (!error && data) {
      setLivreurs(data);
      const initialPassStates: { [key: number]: string } = {};
      data.forEach((l: any) => { initialPassStates[l.id] = l.mot_de_passe || ""; });
      setModifPassLivreur(initialPassStates);
    }
  }

  async function handleAjouterLivreur(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("livreurs").insert([{ nom: nomLivreur, telephone: telLivreur, mot_de_passe: passLivreur }]);
    if (!error) {
      setMessageLivreur({ type: "success", text: "Livreur enregistré !" });
      setNomLivreur(""); setTelLivreur(""); setPassLivreur(""); fetchLivreurs();
    } else {
      setMessageLivreur({ type: "error", text: "Erreur : " + error.message });
    }
  }

  async function handleMettreAJourMotDePasse(id: number, nouveauPass: string) {
    if (!nouveauPass || nouveauPass.trim() === "") return alert("Le mot de passe ne peut pas être vide !");
    const { error } = await supabase.from("livreurs").update({ mot_de_passe: nouveauPass }).eq("id", id);
    if (!error) { alert("✅ Mot de passe mis à jour !"); fetchLivreurs(); }
  }

  async function handleSupprimerLivreur(id: number, nom: string) {
    if (!window.confirm(`Supprimer le livreur ${nom} ?`)) return;
    const { error } = await supabase.from("livreurs").delete().eq("id", id);
    if (!error) fetchLivreurs();
  }

  // --- FONCTIONS MENU ---
  async function fetchProduits() {
    const { data, error } = await supabase.from("produits").select("*").order("id", { ascending: false });
    if (!error) setProduits(data || []);
  }

  const chargerFormulairePourModification = (produit: any) => {
    setEditingProduit(produit);
    setTitre(produit.titre || produit.nom || "");
    setDescription(produit.description || "");
    setPrix(produit.prix?.toString() || "");
    setCategorieSelected(produit.categorie || (categories.length > 0 ? categories[0].nom : ""));
    setImageUrl(produit.image_url || "");
    setSupplements(produit.supplements || []); 
    setImageFile(null);
    setMessageMenu(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annulerModification = () => {
    setEditingProduit(null);
    setTitre(""); setDescription(""); setPrix(""); setImageUrl("");
    setCategorieSelected(categories.length > 0 ? categories[0].nom : ""); setSupplements([]); 
    setImageFile(null); setMessageMenu(null); setSuppNom(""); setSuppPrix("");
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessageMenu(null);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, imageFile, { cacheControl: '3600', upsert: false });
        if (uploadError) throw new Error(`Erreur image : ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }

      const donneesProduit = { 
        nom: titre, 
        titre: titre, 
        description: description, 
        prix: parseFloat(prix), 
        categorie: categorieSelected, 
        image_url: finalImageUrl,
        supplements: supplements 
      };

      if (editingProduit) {
        const { error } = await supabase.from("produits").update(donneesProduit).eq("id", editingProduit.id);
        if (error) throw error;
        setMessageMenu({ type: "success", text: "🔄 Produit mis à jour !" });
      } else {
        const { error } = await supabase.from("produits").insert([donneesProduit]);
        if (error) throw error;
        setMessageMenu({ type: "success", text: "✅ Produit ajouté !" });
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
    if (!error) fetchProduits();
  };

  if (!estAdminAuthentifie) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto mx-auto mb-4 object-contain" />
          <h1 className="text-3xl font-black uppercase mb-2">Panel <span className="text-red-600">Admin</span></h1>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="password" value={saisieCodeAdmin} onChange={(e) => setSaisieCodeAdmin(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white text-center tracking-widest focus:border-red-600 outline-none" placeholder="••••••••" autoFocus />
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg uppercase tracking-wide">Déverrouiller</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-8 text-center flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto mb-2 object-contain" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Panel Admin</h1>
          <div className="h-0.5 w-12 bg-red-600 mt-2 rounded-full mx-auto"></div>
        </div>

        {/* BARRE D'ONGLETS MISE À JOUR */}
        <div className="flex flex-wrap justify-center gap-3 mb-10 border-b border-zinc-800 pb-4">
          <button onClick={() => setOngletActif("commandes")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "commandes" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>📦 Commandes ({commandes.length})</button>
          <button onClick={() => setOngletActif("categories")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "categories" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>📁 Catégories ({categories.length})</button>
          <button onClick={() => setOngletActif("menu")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "menu" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>🍔 Gestion du Menu</button>
          <button onClick={() => setOngletActif("livreurs")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "livreurs" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>Livreurs ({livreurs.length})</button>
        </div>

        {/* ONGLET 1 : COMMANDES */}
        {ongletActif === "commandes" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
             <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold uppercase tracking-wider text-gray-300">Suivi des commandes</h2><button onClick={fetchCommandes} className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold py-2 px-4 rounded-lg uppercase">🔄 Rafraîchir</button></div>
            {chargementCommandes ? ( <div className="text-center py-12 text-gray-500 animate-pulse">Chargement...</div> ) : commandes.length === 0 ? ( <p className="text-gray-500 text-center py-12">Aucune commande pour le moment.</p> ) : (
              <div className="space-y-4">
                {commandes.map((cmd) => {
                  const livreurAttribue = livreurs.find(l => l.id === cmd.livreur_id);
                  return (
                    <div key={cmd.id} className="bg-zinc-950 border border-zinc-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1 grow w-full md:w-auto">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-sm bg-zinc-800 text-white px-2 py-1 rounded font-mono font-bold">#{cmd.id}</span>
                          <h3 className="font-bold text-lg text-white">{cmd.nom_client}</h3>
                          <span className={`text-xs uppercase font-extrabold px-2 py-1 rounded ${cmd.statut === "en attente" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : cmd.statut === "en cours" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : cmd.statut === "en route" ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>{cmd.statut === "en route" && livreurAttribue ? `En route (${livreurAttribue.nom})` : cmd.statut}</span>
                        </div>
                        <p className="text-sm text-red-500 font-bold">📞 {cmd.telephone_client || cmd.telephone}</p>
                        <p className="text-sm text-gray-400">📍 {cmd.adresse_livraison || cmd.adresse}</p>
                        
                        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800/50 mt-2">
                          <p className="text-xs text-gray-500 uppercase font-bold mb-1">Détails de la commande :</p>
                          <p className="text-sm text-gray-300 font-medium whitespace-pre-wrap">{cmd.details_commande}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-zinc-800">
                        <div className="text-right w-full md:w-auto flex md:block justify-between items-center"><span className="text-xs text-gray-500 uppercase">Total</span><span className="text-2xl font-black text-red-500 block">{cmd.total} DA</span></div>
                        <div className="flex flex-wrap md:flex-nowrap gap-2 w-full justify-end items-center">
                          {cmd.statut === "en attente" && <button onClick={() => modifierStatutCommande(cmd.id, "en cours")} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg uppercase w-full md:w-auto">👨‍🍳 Préparer</button>}
                          {cmd.statut === "en cours" && (
                            <div className="flex gap-1 w-full md:w-auto">
                              <select value={livreurSelectionne[cmd.id] || ""} onChange={(e) => setLivreurSelectionne({ ...livreurSelectionne, [cmd.id]: e.target.value })} className="bg-zinc-900 border border-zinc-800 text-xs font-bold p-2 rounded-lg text-white outline-none cursor-pointer">
                                <option value="">-- Sélectionner --</option>
                                {livreurs.map((l, index) => <option key={l.id || index} value={l.id ? String(l.id) : ""}>{l.nom}</option>)}
                              </select>
                              <button onClick={() => attribuerLivreur(cmd.id)} className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-3 rounded-lg uppercase">Confier</button>
                            </div>
                          )}
                          {cmd.statut === "en route" && <button onClick={() => modifierStatutCommande(cmd.id, "livré")} className="bg-green-600/20 text-green-500 border border-green-500/30 text-xs font-bold py-2 px-3 rounded-lg uppercase hover:bg-green-600 hover:text-white">Forcer Livré</button>}
                          <button onClick={async () => { if(window.confirm("Supprimer ?")) { await supabase.from("commandes").delete().eq("id", cmd.id); fetchCommandes(); } }} className="bg-zinc-900 hover:bg-red-600/20 text-gray-500 text-xs font-bold p-2 rounded-lg">🗑️</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* NOUVEL ONGLET : GESTION DES CATEGORIES */}
        {ongletActif === "categories" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase">Créer une catégorie</h2>
              {messageCategorie && <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${messageCategorie.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"}`}>{messageCategorie.text}</div>}
              <form onSubmit={handleAjouterCategorie} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Nom de la catégorie</label>
                  <input type="text" required placeholder="Ex: Tacos, Crêpes, Extras..." value={nomNouvelleCategorie} onChange={(e) => setNomNouvelleCategorie(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" />
                </div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg uppercase text-sm">➕ Ajouter la catégorie</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 uppercase text-gray-300">📁 Catégories Actives ({categories.length})</h2>
              {categories.length === 0 ? <p className="text-gray-500 text-center py-8">Aucune catégorie.</p> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat, index) => (
                    <div key={cat.id || index} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                      <span className="font-bold text-white text-lg">📁 {cat.nom}</span>
                      <button onClick={() => handleSupprimerCategorie(cat.id, cat.nom)} className="bg-red-600/10 text-red-500 text-xs font-bold py-2 px-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors">🗑️ Supprimer</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ONGLET MENU (MIS À JOUR POUR CHARGER LES CATÉGORIES DE LA BASE) */}
        {ongletActif === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit sticky top-6">
              <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase">{editingProduit ? "🔄 Modifier" : "✨ Ajouter un produit"}</h2>
              {messageMenu && <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${messageMenu.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"}`}>{messageMenu.text}</div>}
              <form onSubmit={handleMenuSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Nom</label><input type="text" required value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none" /></div>
                
                {/* SELECT CONNECTÉ AUX CATEGORIES EN BDD */}
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Catégorie</label>
                  <select value={categorieSelected} onChange={(e) => setCategorieSelected(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none cursor-pointer">
                    {categories.length === 0 ? <option value="">-- Créez d'abord une catégorie --</option> : 
                      categories.map(cat => <option key={cat.id} value={cat.nom}>{cat.nom}</option>)
                    }
                  </select>
                </div>

                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Prix de base (DA)</label><input type="number" required value={prix} onChange={(e) => setPrix(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none" /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Description</label><textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none" /></div>
                
                {/* BLOC SUPPLÉMENTS */}
                <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl">
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-2">➕ Options / Suppléments</label>
                  <div className="flex gap-2 mb-3">
                    <input type="text" placeholder="Ex: Fromage, Sauce..." value={suppNom} onChange={(e) => setSuppNom(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none text-sm" />
                    <input type="number" placeholder="Prix" value={suppPrix} onChange={(e) => setSuppPrix(e.target.value)} className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none text-sm" />
                    <button type="button" onClick={() => {
                      if (suppNom.trim() !== "" && suppPrix !== "") {
                        setSupplements([...supplements, { nom: suppNom.trim(), prix: parseFloat(suppPrix) }]);
                        setSuppNom(""); setSuppPrix("");
                      }
                    }} className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-2 rounded-lg text-sm">Ajouter</button>
                  </div>
                  {supplements.length > 0 && (
                    <div className="space-y-2 mt-2 max-h-32 overflow-y-auto pr-1">
                      {supplements.map((s, index) => (
                        <div key={index} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-sm">
                          <span className="text-gray-300">{s.nom} <span className="text-green-500 font-bold">(+{s.prix} DA)</span></span>
                          <button type="button" onClick={() => setSupplements(supplements.filter((_, i) => i !== index))} className="text-gray-500 hover:text-red-500 p-1">❌</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Image</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white text-sm file:bg-red-600 file:text-white file:rounded-full file:border-0" /></div>
                
                <div className="pt-2 space-y-2">
                  <button type="submit" disabled={uploading || categories.length === 0} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg uppercase text-sm disabled:opacity-50">{uploading ? "Traitement..." : editingProduit ? "💾 Enregistrer" : "✅ Valider le produit"}</button>
                  {editingProduit && <button type="button" onClick={annulerModification} className="w-full bg-zinc-800 text-gray-300 font-bold py-2 rounded-lg uppercase text-xs">❌ Annuler</button>}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 uppercase text-gray-300">📋 Ton Menu</h2>
              {produits.length === 0 ? <p className="text-gray-500 text-center py-8">Aucun produit.</p> : (
                <div className="space-y-10">
                  {categories.map(cat => {
                    const filtered = produits.filter(p => p.categorie === cat.nom);
                    if (filtered.length === 0) return null;
                    return (
                      <div key={cat.id}>
                        <h3 className="text-xl font-bold text-red-500 border-b border-zinc-800 pb-2 mb-4 uppercase tracking-widest">{cat.nom}</h3>
                        <div className="space-y-3">
                          {filtered.map((p) => (
                            <div key={p.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                              <div className="flex items-start gap-4">
                                {p.image_url && <img src={p.image_url} alt={p.titre} className="w-16 h-16 object-cover rounded-lg mt-1" />}
                                <div>
                                  <h4 className="font-bold text-white text-lg">{p.titre || p.nom}</h4>
                                  <p className="text-sm text-red-500 font-bold mb-2">{p.prix} DA</p>
                                  {p.supplements && p.supplements.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {p.supplements.map((s: any, idx: number) => (
                                        <span key={idx} className="bg-zinc-900 border border-zinc-800 text-[10px] text-gray-400 px-2 py-0.5 rounded-full">
                                          {s.nom} <span className="text-green-500/80">+{s.prix}</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <button onClick={() => chargerFormulairePourModification(p)} className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold py-2 px-3 rounded-lg">✏️ Modifier</button>
                                <button onClick={() => handleSupprimerProduit(p.id, p.titre || p.nom)} className="bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 text-xs font-bold py-2 px-3 rounded-lg transition-colors">🗑️</button>
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

        {/* ONGLET LIVREURS */}
        {ongletActif === "livreurs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
              <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase">🎯 Recruter un Livreur</h2>
              {messageLivreur && <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${messageLivreur.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"}`}>{messageLivreur.text}</div>}
              <form onSubmit={handleAjouterLivreur} className="space-y-4">
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Nom complet</label><input type="text" required placeholder="Ex: Karim" value={nomLivreur} onChange={(e) => setNomLivreur(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">N° Téléphone</label><input type="tel" required placeholder="Ex: 0550..." value={telLivreur} onChange={(e) => setTelLivreur(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Mot de passe du livreur</label><input type="text" required placeholder="Ex: 4455" value={passLivreur} onChange={(e) => setPassLivreur(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm font-mono" /></div>
                <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg uppercase text-sm">➕ Recruter</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 uppercase text-gray-300">👥 L'Équipe ({livreurs.length})</h2>
              {livreurs.length === 0 ? <p className="text-gray-500 text-center py-8">Aucun livreur.</p> : (
                <div className="space-y-4">
                  {livreurs.map((livreur, index) => (
                    <div key={livreur.id || index} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div><h4 className="font-bold text-lg text-white">🛵 {livreur.nom}</h4><p className="text-xs text-gray-400 font-mono">Tél: {livreur.telephone}</p></div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden p-1">
                          <span className="text-[10px] text-gray-500 font-bold px-2 uppercase font-sans">Code :</span>
                          <input type="text" value={modifPassLivreur[livreur.id] || ""} onChange={(e) => setModifPassLivreur({ ...modifPassLivreur, [livreur.id]: e.target.value })} className="bg-black text-white font-mono text-xs p-1.5 rounded w-20 text-center border-0 outline-none focus:bg-zinc-950" />
                        </div>
                        <button onClick={() => handleMettreAJourMotDePasse(livreur.id, modifPassLivreur[livreur.id])} className="bg-zinc-800 hover:bg-green-600 hover:text-white text-gray-300 text-xs font-bold py-2 px-3 rounded-lg transition-colors">Modifier 💾</button>
                        <button onClick={() => handleSupprimerLivreur(livreur.id, livreur.nom)} className="bg-zinc-900 text-gray-500 text-xs p-2 rounded-lg hover:bg-red-600/20 hover:text-red-500">🗑️</button>
                      </div>
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