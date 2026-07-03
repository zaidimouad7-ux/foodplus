"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// Connexion à Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ⚠️ METS LE NOM EXACT DE TON BUCKET ICI (ATTENTION AUX MAJUSCULES !)
// Si sur ton Supabase il s'appelle "produits", laisse comme ça. Si c'est "Produits", mets un P majuscule.
const BUCKET_NAME = "produits"; 

export default function AdminMenuPage() {
  // États pour le formulaire
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [prix, setPrix] = useState("");
  const [imageUrl, setImageUrl] = useState(""); // Garde l'ancienne URL si modification
  const [imageFile, setImageFile] = useState<File | null>(null); // Le fichier image sélectionné
  
  // États de gestion
  const [produits, setProduits] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [editingProduit, setEditingProduit] = useState<any | null>(null);

  useEffect(() => {
    fetchProduits();
  }, []);

  async function fetchProduits() {
    const { data, error } = await supabase
      .from("produits")
      .select("*")
      .order("id", { ascending: false });
    
    if (!error) {
      setProduits(data || []);
    }
  }

  const chargerFormulairePourModification = (produit: any) => {
    setEditingProduit(produit);
    setTitre(produit.titre || produit.nom || "");
    setDescription(produit.description || "");
    setPrix(produit.prix?.toString() || "");
    setImageUrl(produit.image_url || "");
    setImageFile(null); 
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const annulerModification = () => {
    setEditingProduit(null);
    setTitre("");
    setDescription("");
    setPrix("");
    setImageUrl("");
    setImageFile(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    try {
      let finalImageUrl = imageUrl;

      // --- LOGIQUE D'UPLOAD DE L'IMAGE ---
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        // Envoi de l'image dans le bucket dynamique
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME) 
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Le bucket "${BUCKET_NAME}" n'a pas été trouvé ou est inaccessible. Vérifie son nom exact sur Supabase !`);
        }

        // Récupération du lien public
        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData.publicUrl;
      }

      // --- ENREGISTREMENT DANS LA BASE DE DONNÉES ---
      const donneesProduit = {
        nom: titre, 
        titre: titre,
        description: description,
        prix: parseFloat(prix),
        image_url: finalImageUrl,
      };

      if (editingProduit) {
        const { error } = await supabase
          .from("produits")
          .update(donneesProduit)
          .eq("id", editingProduit.id);

        if (error) throw error;
        setMessage({ type: "success", text: "🔄 Produit mis à jour avec succès !" });
      } else {
        const { error } = await supabase
          .from("produits")
          .insert([donneesProduit]);

        if (error) throw error;
        setMessage({ type: "success", text: "✅ Nouveau produit ajouté au menu !" });
      }

      annulerModification();
      fetchProduits();

    } catch (error: any) {
      const detailsErreur = error?.message || JSON.stringify(error, null, 2);
      console.error("Erreur complète:", detailsErreur);
      setMessage({ type: "error", text: "❌ " + detailsErreur });
    } finally {
      setUploading(false);
    }
  };

  const handleSupprimer = async (id: number, nomProduit: string) => {
    const confirmer = window.confirm(`Êtes-vous sûr de vouloir supprimer "${nomProduit}" du menu ?`);
    if (!confirmer) return;

    try {
      const { error } = await supabase.from("produits").delete().eq("id", id);
      if (error) throw error;
      setMessage({ type: "success", text: "🗑️ Produit supprimé du menu." });
      fetchProduits();
    } catch (error: any) {
      alert("Erreur lors de la suppression : " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold uppercase tracking-wide">
            Menu Admin - <span className="text-red-600">Food Plus</span>
          </h1>
          <div className="h-1 w-24 bg-red-600 mt-4 rounded-full mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* FORMULAIRE */}
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl h-fit sticky top-6">
            <h2 className="text-2xl font-bold mb-6 text-red-500 uppercase tracking-wider">
              {editingProduit ? "🔄 Modifier le produit" : "✨ Ajouter un produit"}
            </h2>

            {message && (
              <div className={`p-4 rounded-lg mb-6 text-sm font-semibold border ${
                message.type === "success" ? "bg-green-950/40 border-green-500 text-green-400" : "bg-red-950/40 border-red-500 text-red-400"
              }`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Nom du produit</label>
                <input type="text" required placeholder="Ex: Double Burger Cheese" value={titre} onChange={(e) => setTitre(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Prix (DA)</label>
                <input type="number" required placeholder="Ex: 850" value={prix} onChange={(e) => setPrix(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Description / Ingrédients</label>
                <textarea rows={3} placeholder="Ex: Pain brioché, 2x steaks..." value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-white focus:border-red-600 outline-none" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Image du produit</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer outline-none" 
                />
                {editingProduit && imageUrl && !imageFile && (
                  <div className="mt-2 text-xs text-gray-500">Image actuelle conservée. Sélectionnez un nouveau fichier pour la changer.</div>
                )}
              </div>

              <div className="pt-2 space-y-2">
                <button type="submit" disabled={uploading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg uppercase tracking-wide transition-colors text-sm"
                >
                  {uploading ? "Traitement et Upload..." : editingProduit ? "💾 Enregistrer" : "➕ Ajouter au menu"}
                </button>

                {editingProduit && (
                  <button type="button" onClick={annulerModification}
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold py-2 rounded-lg uppercase tracking-wide transition-colors text-xs"
                  >
                    ❌ Annuler
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* LISTE DES PRODUITS */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold mb-6 uppercase tracking-wider text-gray-300">
              📋 Produits au menu ({produits.length})
            </h2>

            <div className="space-y-4">
              {produits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Aucun produit dans la base de données.</p>
              ) : (
                produits.map((produit) => (
                  <div key={produit.id} className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-700 transition-colors">
                    
                    <div className="flex items-center gap-4">
                      {produit.image_url && (
                        <img src={produit.image_url} alt={produit.titre} className="w-16 h-16 object-cover rounded-lg bg-zinc-900 border border-zinc-800 shrink-0" />
                      )}
                      <div>
                        <h3 className="font-bold text-lg text-white uppercase">{produit.titre || produit.nom}</h3>
                        <p className="text-sm text-red-500 font-black">{produit.prix} DA</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-1 max-w-md">{produit.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto justify-end">
                      <button onClick={() => chargerFormulairePourModification(produit)} className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors uppercase">
                        ✏️ Modifier
                      </button>
                      <button onClick={() => handleSupprimer(produit.id, produit.titre || produit.nom)} className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-xs font-bold py-2 px-4 rounded-lg transition-colors uppercase border border-red-600/20">
                        🗑️ Supprimer
                      </button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}