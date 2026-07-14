"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const BUCKET_NAME = "produits"; 

export default function AdminDashboard() {
  const [estAdminAuthentifie, setEstAdminAuthentifie] = useState(false);
  const [saisieCodeAdmin, setSaisieCodeAdmin] = useState("");
  const [ongletActif, setOngletActif] = useState<"commandes" | "menu" | "livreurs" | "categories">("commandes");

  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(true);
  const [livreurSelectionne, setLivreurSelectionne] = useState<{ [key: number]: string }>({});

  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [nomLivreur, setNomLivreur] = useState("");
  const [telLivreur, setTelLivreur] = useState("");
  const [passLivreur, setPassLivreur] = useState("");
  const [modifPassLivreur, setModifPassLivreur] = useState<{ [key: number]: string }>({});

  const [categories, setCategories] = useState<any[]>([]);
  const [nomNouvelleCategorie, setNomNouvelleCategorie] = useState("");
  const [messageCategorie, setMessageCategorie] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [produits, setProduits] = useState<any[]>([]);
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [categorieSelected, setCategorieSelected] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [variantes, setVariantes] = useState<{nom: string, prix: number}[]>([]);
  const [varNom, setVarNom] = useState("");
  const [varPrix, setVarPrix] = useState("");

  const [supplements, setSupplements] = useState<{nom: string, prix: number}[]>([]);
  const [suppNom, setSuppNom] = useState("");
  const [suppPrix, setSuppPrix] = useState("");

  const [uploading, setUploading] = useState(false);
  const [messageMenu, setMessageMenu] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [editingProduit, setEditingProduit] = useState<any | null>(null);

  useEffect(() => {
    if (localStorage.getItem("adminAuth") === "true") setEstAdminAuthentifie(true);
  }, []);

  useEffect(() => {
    if (estAdminAuthentifie) {
      fetchCommandes(); fetchCategories(); fetchProduits(); fetchLivreurs();

      const channel = supabase
        .channel('custom-insert-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'commandes' },
          (payload) => {
            fetchCommandes();
        
            setTimeout(() => {
              alert(`🚨 DING DING ! NOUVELLE COMMANDE !\n\n👨 Client : ${payload.new.nom_client}\n💰 Total : ${payload.new.total} DA\n\nVérifiez votre tableau de bord !`);
            }, 500);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [estAdminAuthentifie]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (saisieCodeAdmin === "admin123") { setEstAdminAuthentifie(true); localStorage.setItem("adminAuth", "true"); } 
    else alert("❌ Code administrateur incorrect !");
  };

  async function fetchCategories() {
    const { data, error } = await supabase.from("categories").select("*").order("id", { ascending: true });
    if (!error && data) { setCategories(data); if (data.length > 0 && !categorieSelected) setCategorieSelected(data[0].nom); }
  }

  async function handleAjouterCategorie(e: React.FormEvent) {
    e.preventDefault(); setMessageCategorie(null);
    if (!nomNouvelleCategorie.trim()) return;
    const { error } = await supabase.from("categories").insert([{ nom: nomNouvelleCategorie.trim() }]);
    if (!error) { setMessageCategorie({ type: "success", text: "Catégorie ajoutée !" }); setNomNouvelleCategorie(""); fetchCategories(); } 
    else setMessageCategorie({ type: "error", text: "Erreur : " + error.message });
  }

  async function handleSupprimerCategorie(id: number, nom: string) {
    if (!window.confirm(`Supprimer la catégorie "${nom}" ?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (!error) fetchCategories();
  }

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
    if (!livreurIdStr || livreurIdStr === "") return alert("Sélectionner un livreur !");
    const { error } = await supabase.from("commandes").update({ livreur_id: parseInt(livreurIdStr, 10), statut: "en route" }).eq("id", commandeId);
    if (!error) fetchCommandes();
  }

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
    if (!error) { setNomLivreur(""); setTelLivreur(""); setPassLivreur(""); fetchLivreurs(); }
  }

  async function handleMettreAJourMotDePasse(id: number, nouveauPass: string) {
    if (!nouveauPass || nouveauPass.trim() === "") return alert("Mot de passe vide !");
    const { error } = await supabase.from("livreurs").update({ mot_de_passe: nouveauPass }).eq("id", id);
    if (!error) { alert("✅ Mot de passe mis à jour !"); fetchLivreurs(); }
  }

  async function handleSupprimerLivreur(id: number, nom: string) {
    if (!window.confirm(`Supprimer le livreur ${nom} ?`)) return;
    const { error } = await supabase.from("livreurs").delete().eq("id", id);
    if (!error) fetchLivreurs();
  }

  async function fetchProduits() {
    const { data, error } = await supabase.from("produits").select("*").order("id", { ascending: false });
    if (!error) setProduits(data || []);
  }

  const chargerFormulairePourModification = (produit: any) => {
    setEditingProduit(produit); setTitre(produit.titre || produit.nom || "");
    setDescription(produit.description || ""); setPrix(produit.prix?.toString() || "");
    setCategorieSelected(produit.categorie || (categories.length > 0 ? categories[0].nom : ""));
    setImageUrl(produit.image_url || "");
    setVariantes(produit.variantes || []); setSupplements(produit.supplements || []); 
    setImageFile(null); setMessageMenu(null); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annulerModification = () => {
    setEditingProduit(null); setTitre(""); setDescription(""); setPrix(""); setImageUrl("");
    setCategorieSelected(categories.length > 0 ? categories[0].nom : ""); 
    setVariantes([]); setSupplements([]); setImageFile(null); setMessageMenu(null); 
    setVarNom(""); setVarPrix(""); setSuppNom(""); setSuppPrix("");
  };

  const handleMenuSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setUploading(true); setMessageMenu(null);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, imageFile);
        if (uploadError) throw new Error(`Erreur image : ${uploadError.message}`);
        const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        finalImageUrl = publicUrlData.publicUrl;
      }
      const donneesProduit = { 
        nom: titre, titre: titre, description: description, prix: parseFloat(prix), categorie: categorieSelected, 
        image_url: finalImageUrl, variantes: variantes, supplements: supplements 
      };
      if (editingProduit) {
        const { error } = await supabase.from("produits").update(donneesProduit).eq("id", editingProduit.id);
        if (error) throw error; setMessageMenu({ type: "success", text: "🔄 Produit mis à jour !" });
      } else {
        const { error = null } = await supabase.from("produits").insert([donneesProduit]);
        if (error) throw error; setMessageMenu({ type: "success", text: "✅ Produit ajouté !" });
      }
      annulerModification(); fetchProduits();
    } catch (error: any) { setMessageMenu({ type: "error", text: "❌ " + error.message }); } 
    finally { setUploading(false); }
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

  // --- FONCTION POUR FORMATER LA DATE ET L'HEURE ---
  const formaterDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit'
    }) + ' à ' + date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center flex flex-col items-center justify-center">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto mb-2 object-contain" />
          <h1 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Panel Admin</h1>
          <div className="h-0.5 w-12 bg-red-600 mt-2 rounded-full mx-auto"></div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-10 border-b border-zinc-800 pb-4">
          <button onClick={() => setOngletActif("commandes")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "commandes" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>📦 Commandes ({commandes.length})</button>
          <button onClick={() => setOngletActif("categories")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "categories" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>📁 Catégories ({categories.length})</button>
          <button onClick={() => setOngletActif("menu")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "menu" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>🍔 Gestion du Menu</button>
          <button onClick={() => setOngletActif("livreurs")} className={`py-3 px-5 rounded-xl font-bold uppercase tracking-wider transition-all text-xs md:text-sm ${ongletActif === "livreurs" ? "bg-red-600 text-white shadow-lg" : "bg-zinc-900 text-gray-400 border border-zinc-800"}`}>Livreurs ({livreurs.length})</button>
        </div>

        {/* ONGLET COMMANDES (AVEC AFFICHAGE DE LA DATE ET HEURE) */}
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
                           
                           {/* NOUVEAU : AFFICHAGE DE L'HEURE (ex: 14/07 à 19:04) */}
                           {cmd.created_at && (
                             <span className="text-xs text-gray-400 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-md font-mono flex items-center gap-1">
                               ⏱️ {formaterDate(cmd.created_at)}
                             </span>
                           )}

                           <h3 className="font-bold text-lg text-white ml-1">{cmd.nom_client}</h3>
                           <span className={`text-xs uppercase font-extrabold px-2 py-1 rounded ${cmd.statut === "en attente" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : cmd.statut === "en cours" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" : cmd.statut === "en route" ? "bg-purple-500/10 text-purple-500 border border-purple-500/20" : "bg-green-500/10 text-green-500 border border-green-500/20"}`}>{cmd.statut === "en route" && livreurAttribue ? `En route (${livreurAttribue.nom})` : cmd.statut}</span>
                         </div>
                         <p className="text-sm text-red-500 font-bold mt-1">📞 {cmd.telephone_client || cmd.telephone}</p>
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

        {/* ONGLET CATEGORIES */}
        {ongletActif === "categories" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
               <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase">Créer une catégorie</h2>
               {messageCategorie && <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${messageCategorie.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"}`}>{messageCategorie.text}</div>}
               <form onSubmit={handleAjouterCategorie} className="space-y-4">
                 <div><input type="text" required placeholder="Ex: Tacos, Crêpes..." value={nomNouvelleCategorie} onChange={(e) => setNomNouvelleCategorie(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none text-sm" /></div>
                 <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg uppercase text-sm">➕ Ajouter la catégorie</button>
               </form>
             </div>
             <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
               <h2 className="text-2xl font-bold mb-6 uppercase text-gray-300">📁 Catégories Actives ({categories.length})</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {categories.map((cat, index) => (
                   <div key={cat.id || index} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                     <span className="font-bold text-white text-lg">📁 {cat.nom}</span>
                     <button onClick={() => handleSupprimerCategorie(cat.id, cat.nom)} className="bg-red-600/10 text-red-500 text-xs font-bold py-2 px-3 rounded-lg hover:bg-red-600 hover:text-white transition-colors">🗑️</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}

        {/* ONGLET MENU */}
        {ongletActif === "menu" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit lg:sticky lg:top-6">
              <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase">{editingProduit ? "🔄 Modifier" : "✨ Ajouter un produit"}</h2>
              {messageMenu && <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${messageMenu.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"}`}>{messageMenu.text}</div>}
              <form onSubmit={handleMenuSubmit} className="space-y-4">
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Nom du produit (Ex: Crêpes)</label><input type="text" required value={titre} onChange={(e) => setTitre(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none" /></div>
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Catégorie</label>
                  <select value={categorieSelected} onChange={(e) => setCategorieSelected(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none cursor-pointer">
                    {categories.map(cat => <option key={cat.id} value={cat.nom}>{cat.nom}</option>)}
                  </select>
                </div>
                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Prix de base (DA)</label><input type="number" required value={prix} onChange={(e) => setPrix(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none" /></div>
                
                {/* 1. TYPES */}
                <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl">
                  <label className="block text-xs font-bold uppercase text-blue-500 mb-1">🏷️ Les Types (Choix Unique)</label>
                  <p className="text-[10px] text-gray-500 mb-3">Ex: Chocolat Blanc (0 DA), Nutella (+50 DA)... Le client DOIT en choisir un.</p>
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Nom (Ex: Nutella)" value={varNom} onChange={(e) => setVarNom(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none text-sm" />
                    <input type="number" placeholder="Prix +" value={varPrix} onChange={(e) => setVarPrix(e.target.value)} className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none text-sm" />
                    <button type="button" onClick={() => { if (varNom) { setVariantes([...variantes, { nom: varNom, prix: parseFloat(varPrix||"0") }]); setVarNom(""); setVarPrix(""); } }} className="bg-zinc-800 text-white font-bold px-3 py-2 rounded-lg text-sm">+</button>
                  </div>
                  {variantes.map((v, i) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-sm mb-1"><span className="text-gray-300">{v.nom} <span className="text-blue-500">(+{v.prix} DA)</span></span><button type="button" onClick={() => setVariantes(variantes.filter((_, idx) => idx !== i))} className="text-red-500">❌</button></div>
                  ))}
                </div>

                {/* 2. EXTRAS */}
                <div className="bg-black/40 border border-zinc-800 p-4 rounded-xl">
                  <label className="block text-xs font-bold uppercase text-amber-500 mb-1">➕ Les Extras (Choix Multiples)</label>
                  <p className="text-[10px] text-gray-500 mb-3">Ex: Fraise (+100 DA), Banane (+100 DA)... Le client peut en cocher plusieurs.</p>
                  <div className="flex gap-2 mb-2">
                    <input type="text" placeholder="Nom (Ex: Fraise)" value={suppNom} onChange={(e) => setSuppNom(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none text-sm" />
                    <input type="number" placeholder="Prix +" value={suppPrix} onChange={(e) => setSuppPrix(e.target.value)} className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white outline-none text-sm" />
                    <button type="button" onClick={() => { if (suppNom) { setSupplements([...supplements, { nom: suppNom, prix: parseFloat(suppPrix||"0") }]); setSuppNom(""); setSuppPrix(""); } }} className="bg-zinc-800 text-white font-bold px-3 py-2 rounded-lg text-sm">+</button>
                  </div>
                  {supplements.map((s, i) => (
                    <div key={i} className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-sm mb-1"><span className="text-gray-300">{s.nom} <span className="text-amber-500">(+{s.prix} DA)</span></span><button type="button" onClick={() => setSupplements(supplements.filter((_, idx) => idx !== i))} className="text-red-500">❌</button></div>
                  ))}
                </div>

                <div><label className="block text-xs font-bold uppercase text-gray-400 mb-2">Image</label><input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full bg-zinc-950 border border-zinc-800 p-2 text-white text-sm" /></div>
                
                <div className="pt-2 space-y-2">
                  <button type="submit" disabled={uploading || categories.length === 0} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg uppercase text-sm disabled:opacity-50">{uploading ? "Traitement..." : editingProduit ? "💾 Enregistrer" : "✅ Valider"}</button>
                  {editingProduit && <button type="button" onClick={annulerModification} className="w-full bg-zinc-800 text-gray-300 font-bold py-2 rounded-lg uppercase text-xs">❌ Annuler</button>}
                </div>
              </form>
            </div>

            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 uppercase text-gray-300">📋 Ton Menu</h2>
              {categories.map(cat => {
                const filtered = produits.filter(p => p.categorie === cat.nom);
                if (filtered.length === 0) return null;
                return (
                  <div key={cat.id} className="mb-10">
                    <h3 className="text-xl font-bold text-red-500 border-b border-zinc-800 pb-2 mb-4 uppercase tracking-widest">{cat.nom}</h3>
                    <div className="space-y-3">
                      {filtered.map((p) => (
                        <div key={p.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex justify-between items-center">
                          <div className="flex gap-4 items-center">
                            {p.image_url && <img src={p.image_url} alt={p.titre} className="w-16 h-16 object-cover rounded-lg" />}
                            <div><h4 className="font-bold text-white text-lg">{p.titre || p.nom}</h4><p className="text-sm text-red-500 font-bold">{p.prix} DA</p></div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => chargerFormulairePourModification(p)} className="bg-zinc-800 hover:bg-zinc-700 text-xs font-bold py-2 px-3 rounded-lg">✏️</button>
                            <button onClick={() => handleSupprimerProduit(p.id, p.titre || p.nom)} className="bg-red-600/10 hover:bg-red-600 hover:text-white text-red-500 text-xs font-bold py-2 px-3 rounded-lg">🗑️</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {/* ONGLET LIVREURS */}
        {ongletActif === "livreurs" && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit">
               <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase">🎯 Recruter un Livreur</h2>
               <form onSubmit={handleAjouterLivreur} className="space-y-4">
                 <input type="text" required placeholder="Nom complet" value={nomLivreur} onChange={(e) => setNomLivreur(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none text-sm" />
                 <input type="tel" required placeholder="N° Téléphone" value={telLivreur} onChange={(e) => setTelLivreur(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none text-sm" />
                 <input type="text" required placeholder="Mot de passe" value={passLivreur} onChange={(e) => setPassLivreur(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white outline-none text-sm font-mono" />
                 <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg uppercase text-sm">➕ Recruter</button>
               </form>
             </div>
             <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
               <h2 className="text-2xl font-bold mb-6 uppercase text-gray-300">👥 L'Équipe</h2>
               <div className="space-y-4">
                 {livreurs.map((livreur) => (
                   <div key={livreur.id} className="bg-zinc-950 border border-zinc-800 p-4 rounded-xl flex justify-between items-center">
                     <div><h4 className="font-bold text-white">🛵 {livreur.nom}</h4><p className="text-xs text-gray-400">{livreur.telephone}</p></div>
                     <button onClick={() => handleSupprimerLivreur(livreur.id, livreur.nom)} className="bg-zinc-900 text-gray-500 p-2 rounded-lg hover:text-red-500">🗑️</button>
                   </div>
                 ))}
               </div>
             </div>
           </div>
        )}

      </div>
    </div>
  );
}